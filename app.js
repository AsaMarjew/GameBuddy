// merge test
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

// DB Setup
const { MongoClient } = require('mongodb');
const uri = process.env.DB_KEY;
const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

// --- Multer ---

//afbeeldingen worden opgeslagen in de public/uploads map
const storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, './public/uploads');
  },

  //afbeeldingen krijgen naast de oorspronkelijke naam ook de huidige datum
  filename: function (request, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

//gewijzigde afbeeldingen
const storageWijzig = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, './public/uploads');
  },

  filename: function (request, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

//uploaden en formaat limiet
const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
});

//gewijzigde afbeeldingen
const uploadWijzig = multer({
  storage: storageWijzig,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
});

//de css, img en js map in de public map gebruiken
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public.css'));
app.use('/img', express.static(__dirname + 'public.img'));
app.use('/js', express.static(__dirname + 'public.js'));

//express layout mobiel formaat en ejs gebruiken
app.use(expressLayouts);
app.set('layout', './layouts/mobiel-formaat');
app.set('view engine', 'ejs');

//bodyparser en express.json voor http requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// database connectie mongo-db

// --- routing ---

// render index
app.get('', (req, res) => {
  res.render('index');
});

//aanmelden route
app.get('/aanmelden', (req, res) => {
  res.render('aanmelden');
});

//zoeken route en gebruikers/oproepen in database vinden en mee sturen naar zoeken pagina
app.get('/zoeken', (req, res) => {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  client.connect((err, db) => {
    if (err) throw err;
    db.db('TechTeam')
      .collection('gebruikers')
      .find()
      .toArray()
      .then(gebruikers => {
        res.render('zoeken', {
          gebruikersLijst: gebruikers,
        });
      });
  });
});

//wijzigen route
app.get('/wijzigen', (req, res) => {
  res.render('wijzigen');
});

//verwijderen route
app.get('/verwijderen', (req, res) => {
  res.render('verwijderen');
});

// favorieten route
app.get('/favorieten', renderFavorieten);

//tutorial route
app.get('/hoe-werkt-het', (req, res) => {
  res.render('hoewerkthet');
});

//error route
app.get('/error', (req, res) => {
  res.render('error');
});

// --- post ---

// favorieten post
app.post('/zoeken', handleFavorieten);
app.post('/favorieten', handleFavorietenVerwijderen);

// -- routing functions --

function renderFavorieten(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  client.connect((err, db) => {
    if (err) throw err;
    let favorietenCol = db.db('TechTeam').collection('favorieten');
    let gebruikersCol = db.db('TechTeam').collection('gebruikers');
    favorietenCol.findOne({ id: 0 }).then(results => {
      // request IDs of saved influencers => return influencer objects
      let users = [];
      results.opgeslagen.forEach(gebNaam => {
        users.push(gebruikersCol.findOne({ naam: gebNaam }));
      });
      Promise.all(users)
        .then(data => {
          res.render('favorieten', { gebruikersLijst: data });
          db.close();
        })
        .catch(err => {
          console.log(err);
        });
    });
  });
}

// -- post functions --

function handleFavorieten(req, res) {
  // reinstantiate client to prevent closed topology error
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  let gebNaam = req.body.gebruikerNaam;
  client.connect(function (err, db) {
    if (err) throw err;
    let favorietenCol = db.db('TechTeam').collection('favorieten');
    favorietenCol
      .findOneAndUpdate({ id: 0 }, { $push: { opgeslagen: gebNaam } })
      .then(() => {
        db.close();
      });
  });
  setTimeout(() => {
    res.redirect('back');
  }, 70);
}

function handleFavorietenVerwijderen(req, res) {
  // reinstantiate client to prevent closed topology error
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  let gebNaam = req.body.gebruikerNaam;
  client.connect(function (err, db) {
    if (err) throw err;
    let favorietenCol = db.db('TechTeam').collection('favorieten');
    favorietenCol
      .findOneAndUpdate({ id: 0 }, { $pull: { opgeslagen: gebNaam } })
      .then(() => {
        db.close();
      });
  });
  setTimeout(() => {
    res.redirect('back');
  }, 70);
}

//als er een nieuwe oproep geplaatst wordt, wordt de variabel gebruiker gevuld
app.post('/aanmelden', upload.single('image'), async (req, res) => {
  //console.log(request.file);
  client.connect((err, db) => {
    if (err) throw err;
    db.db('TechTeam')
      .collection('gebruikers')
      .insertOne({
        naam: req.body.naam,
        leeftijd: req.body.leeftijd,
        email: req.body.email,
        telefoon: req.body.telefoon,
        console: req.body.console,
        bio: req.body.bio,
        game1: req.body.game1,
        game2: req.body.game2,
        game3: req.body.game3,
        game4: req.body.game4,
        img: req.file.filename,
      })
      .then(() => {
        db.close();
        res.redirect('/zoeken');
      })
      .catch(err => {
        console.log(err);
      });
  });
});

//filter optie
app.post('/zoeken', async (req, res) => {
  const consoleFilter = req.body.consolefilter;
  //lege query voor als alle aangevingt is
  let query = {};

  if (consoleFilter === 'Alle') {
    query = {};

    //query met de gekozen fitler optie uit de dropdown in de filter menu
  } else {
    query = {
      console: consoleFilter,
    };
  }

  //lean zet het om in mongo objecten
  const gebruikers = await gebruiker.find(query).lean();

  //gebruikerslijst sturen en de filter optie
  res.render('zoeken', {
    gebruikersLijst: gebruikers,
    consoleFilter,
  });
});

//wijzigingen doorvoeren
app.post('/wijzigen', uploadWijzig.single('wijzigimage'), async (req, res) => {
  try {
    //zoeken naar de juiste gebruiker aan de hand van de email die de gebruiker invoert
    client.connect((err, db) => {
      if (err) throw err;
      db.db('TechTeam')
        .collection('gebruikers')
        .findOneAndUpdate()
        .then(() => {
          db.close();
          res.redirect('/zoeken');
        })
        .catch(err => {
          console.log(err);
        });
    });

    // const doc = await gebruiker.findOne({ email: req.body.wijzigemail });
    // doc.overwrite({
    //   naam: req.body.wijzignaam,
    //   leeftijd: req.body.wijzigleeftijd,
    //   email: req.body.wijzigemail,
    //   telefoon: req.body.wijzigtelefoon,
    //   console: req.body.wijzigconsole,
    //   bio: req.body.wijzigbio,
    //   game1: req.body.wijziggame1,
    //   game2: req.body.wijziggame2,
    //   game3: req.body.wijziggame3,
    //   game4: req.body.wijziggame4,
    //   img: req.file.filename,
    // });

    // //de updates worden opgeslagen
    // await doc.save();
    // res.redirect('/zoeken');

    //bij een error wordt de gebruiker doorverwezen naar de error pagina
  } catch (err) {
    console.log(err);
    res.redirect('/error');
  }
});

//met deletemany worden alle records van de object verwijderd, aan de hand van de email
app.post('/verwijderen', async (req, res) => {
  try {
    await gebruiker.deleteMany({
      email: req.body.verwijderemail,
    });
    res.redirect('/zoeken');
  } catch (err) {
    res.redirect('/error');
  }
});

//404
app.use(function (req, res) {
  res.status(404).render('404');
});

//app geeft de port terug
app.listen(port, () => {
  console.log(`Server is aan http://localhost:5000`);
});
