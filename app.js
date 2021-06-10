require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
const bodyParser = require('body-parser');
const session = require('express-session');
//const MongoDBStore = require('connect-mongodb-session')(session);

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

//sessions
// const store = new MongoDBStore({
//   uri: uri,
//   collections: 'sessions',
// });

const sessionID = 'unniqueSessionID';

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('inloggen');
  } else {
    next();
  }
};
const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect('dashboard');
  } else {
    next();
  }
};
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

// use the session middleware
app.use(
  session({
    name: sessionID,
    resave: false,
    saveUninitialized: false,
    // store: store,
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 30,
      sameSite: true,
      // duration before the session is lost = 30 min
    },
  })
);
// database connectie mongo-db

// --- routing ---

// render index
app.get('', (req, res) => {
  console.log(req.session);
  console.log(req.session.id);

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

//tutorial route
app.get('/hoe-werkt-het', (req, res) => {
  res.render('hoewerkthet');
});

//error route
app.get('/error', (req, res) => {
  res.render('error');
});

// --- handle post ---

//als er een nieuwe oproep geplaatst wordt, wordt de variabel gebruiker gevuld
app.post(
  '/aanmelden',
  upload.single('image'),
  redirectHome,
  async (req, res) => {
    const client = new MongoClient(uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    client.connect((err, db) => {
      if (err) throw err;
      db.db('TechTeam')
        .collection('gebruikers')
        .insertOne({
          naam: req.body.naam,
          leeftijd: req.body.leeftijd,
          email: req.body.email,
          wachtwoord: req.body.wachtwoordaanmelden,
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
  }
);

//filter optie
app.post('/zoeken', async (req, res) => {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
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

client.connect((err, db) => {
  if (err) throw err;
  db.db('TechTeam')
    .collection('gebruikers')
    .findOneAndUpdate({ naam: 'Philip' }, { $set: { naam: 'Muhammet' } })
    .then(() => {
      db.close();
      //res.redirect('/zoeken');
    })
    .catch(err => {
      console.log(err);
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

// --- Login ---
app.get('/inloggen', (req, res) => {
  res.render('inloggen');
  console.log(req.session);
});

//render dashboard
app.get('/dashboard', (req, res) => {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  client.connect((err, db) => {
    if (err) throw err;

    db.db('TechTeam')
      .collection('gebruikers')
      .findOne({ email: req.body.emailInloggen })
      .then(gebruiker => {
        res.render('dashboard', { gebruikersLijst: gebruiker });
        db.close();
      });
  });
});

//login with session
app.post('/inloggen', (req, res) => {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  client.connect((err, db) => {
    let gebruikers = db.db('TechTeam').collection('gebruikers');
    if (err) throw err;
    if (req.body.emailInloggen && req.body.wachtwoordInloggen) {
      gebruikers.findOne(
        { email: req.body.emailInloggen },
        (err, gebruiker) => {
          if (err) throw err;
          if (
            gebruiker &&
            gebruiker.wachtwoord === req.body.wachtwoordInloggen
          ) {
            res.redirect('dashboard');
          } else {
            res.redirect('/');
          }
        }
      );
    }
  });
});

app.post('/logout', redirectLogin, (req, res) => {});

//404
app.use((req, res) => {
  res.status(404).render('404');
});

//app geeft de port terug
app.listen(port, () => {
  console.log(`Server is aan http://localhost:5000`);
});
