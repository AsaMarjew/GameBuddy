require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const session = require('express-session');
const sessionID = 'unniqueSessionID';

const app = express();
const port = process.env.PORT || 5000;

// DB Setup
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
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

// Nodemailer - Hier wordt de nodemailer opgezet en wordt er ingelogd op het adres waar emails van verzonden worden
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'gamebuddyteamtech@gmail.com',
    pass: 'teamtech123',
  },
});

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

// --- routing ---

// render index
app.get('/', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.redirect('dashboard');
  }
});

//aanmelden route
app.get('/aanmelden', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('aanmelden');
  } else {
    res.redirect('dashboard');
    console.log(req.session);
  }
});

//zoeken route en gebruikers/oproepen in database vinden en mee sturen naar zoeken pagina
app.get('/zoeken', renderZoeken);

// favorieten route
app.get('/favorieten', renderFavorieten);

//wijzigen route
app.get('/wijzigen', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.redirect('wijzigen');
  }
});

//verwijderen route
app.get('/verwijderen', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.redirect('verwijderen');
  }
});

// Weergave van de verwijdercheck pagina
app.get('/verwijderencheck', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.redirect('verwijderencheck');
  }
});

// Weergave van de verwijderbericht pagina
app.get('/verwijderenbericht', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.redirect('verwijderenbericht');
  }
});

// Weergave van de verwijdernotfound pagina
app.get('/verwijderennotfound', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.redirect('verwijderennotfound');
  }
});

// Weergave van de wijzigenbericht pagina
app.get('/wijzigenbericht', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.redirect('wijzigenbericht');
  }
});

//tutorial route
app.get('/hoe-werkt-het', (req, res) => {
  res.render('hoewerkthet');
});

//error route
app.get('/error', (req, res) => {
  res.render('error');
});

// api get
app.get('/fortnite', renderApi);

// --- ROUTING LOGIN ---

//render login
app.get('/inloggen', renderInloggen);

//render dashboard
app.get('/dashboard', renderDashboard);

//routing login
app.post('/inloggen', inloggenPost);

// routing logout
app.post('/logout', logoutPost);

// --- END ROUTING LOGIN ---

// --- post ---

// filter post
app.post('/zoeken', handleZoeken);
app.post('/favorieten', handleFavorietenVerwijderen);
app.post('/aanmelden', upload.single('image'), handleAanmelden);

// -- routing functions --

async function renderZoeken(req, res) {
  try {
    const client = new MongoClient(uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    client.connect(async (err, db) => {
      if (err) throw err;

      const gebruikersCol = db.db('TechTeam').collection('gebruikers');
      const favorietenCol = db.db('TechTeam').collection('favorieten');

      // haal alle gebruikers op en opgeslagen gebruikers
      let users = await gebruikersCol.find().toArray();
      const favorites = await favorietenCol.findOne({ id: 0 });

      // maak nieuwe array waar opgeslagen gebruikers niet instaan
      let undiscoveredUsers = users.filter(gebruiker => {
        return !favorites.opgeslagen.includes(gebruiker.email);
      });

      res.render('zoeken', { gebruikersLijst: undiscoveredUsers });
      db.close();
    });
  } catch (err) {
    console.log(err);
  }
}

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
      // haal IDs van opgeslagen gebruikers op => geef hele object terug
      let users = [];
      results.opgeslagen.forEach(gebEmail => {
        users.push(gebruikersCol.findOne({ email: gebEmail }));
      });

      // nadat alle gebruikers in de user array zitten => render pagina
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

async function renderApi(req, res) {
  // --- fortnite API ---
  const fortniteApi = await fetch(
    'https://fortnite-api.theapinetwork.com/items/list'
  )
    .then(res => res.json())
    .then(json => {
      console.log('test');

      //GEGEVENS 0
      const naam0 = json.data[3].item.name;
      const desc0 = json.data[3].item.description;
      const type0 = json.data[3].item.type;
      const img0 = json.data[3].item.images.background;
      var array0 = [naam0, desc0, type0];

      //GEGEVENS 1
      const naam1 = json.data[5].item.name;
      const desc1 = json.data[5].item.description;
      const type1 = json.data[5].item.type;
      const img1 = json.data[5].item.images.background;
      var array1 = [naam1, desc1, type1];

      //GEGEVENS 2
      const naam2 = json.data[6].item.name;
      const desc2 = json.data[6].item.description;
      const type2 = json.data[6].item.type;
      const img2 = json.data[6].item.images.background;
      var array2 = [naam2, desc2, type2];

      //GEGEVENS 3
      const naam3 = json.data[10].item.name;
      const desc3 = json.data[10].item.description;
      const type3 = json.data[10].item.type;
      const img3 = json.data[10].item.images.background;
      var array3 = [naam3, desc3, type3];

      //GEGEVENS 4
      const naam4 = json.data[12].item.name;
      const desc4 = json.data[12].item.description;
      const type4 = json.data[12].item.type;
      const img4 = json.data[12].item.images.background;
      var array4 = [naam4, desc4, type4];

      res.render('fortnite', {
        array0: array0,
        img0: img0,
        array1: array1,
        img1: img1,
        array2: array2,
        img2: img2,
        array3: array3,
        img3: img3,
        array4: array4,
        img4: img4,
      });
    });
}

// -- handle post --

function handleZoeken(req, res) {
  //nieuwe variabel gebruikersnaam uit favorieten
  let gebEmail = req.body.gebruikerEmail;

  //check of de favorieten gebruikersnaam bestaat
  if (gebEmail) {
    handleFavorieten(req, res);
    //als het niet bestaat wordt filteren uitgevoerd
  } else {
    handleFilteren(req, res);
  }
}

//filter optie
function handleFilteren(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  //gekozen console optie door de gebruiker
  const consoleFilter = req.body.consolefilter;

  //connectie database
  client.connect((err, db) => {
    if (err) throw err;

    //nieuwe lege query
    let query = {};

    //als gebruiker op de optie alle klikt wordt er een lege query verstuurd
    if (consoleFilter === 'Alle') {
      query = {};
      //als de gebruiker een console kiest wordt de console uit de form in de query gezet
    } else {
      query = {
        console: consoleFilter,
      };
    }

    //verbinding met db en de collectie
    db.db('TechTeam')
      .collection('gebruikers')
      //in de db wordt met de query gezocht
      .find(query)
      //resultaten worden in een array gezet
      .toArray(function (err, gebruikers) {
        if (err) throw err;
        //de gegevens worden gerenderd
        res.render('zoeken', {
          gebruikersLijst: gebruikers,
          consoleFilter,
        });
        db.close();
      });
  });
}

function handleFavorieten(req, res) {
  // reinstantiate client to prevent closed topology error
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  // voeg gebruikers email aan favorieten toe
  let gebEmail = req.body.gebruikerEmail;

  client.connect(function (err, db) {
    if (err) throw err;
    let favorietenCol = db.db('TechTeam').collection('favorieten');
    favorietenCol
      .findOneAndUpdate({ id: 0 }, { $push: { opgeslagen: gebEmail } })
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

  // verwijder gebruikers ID van favorieten
  let gebEmail = req.body.gebruikerEmail;
  client.connect(function (err, db) {
    if (err) throw err;
    let favorietenCol = db.db('TechTeam').collection('favorieten');
    favorietenCol
      .findOneAndUpdate({ id: 0 }, { $pull: { opgeslagen: gebEmail } })
      .then(() => {
        db.close();
      });
  });
  setTimeout(() => {
    res.redirect('back');
  }, 70);
}

// nieuwe gebruiker object aanmaken
async function handleAanmelden(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  client.connect((err, db) => {
    if (err) throw err;

    // als javascript aanstaat gebruik de compressed image als img, als js uitstaat gebruik multer voor img upload
    if (req.body.img) {
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
          img: req.body.img,
          favorieten: [],
        })
        .then(() => {
          db.close();
          res.redirect('/zoeken');
        })
        .catch(err => {
          console.log(err);
        });
    } else {
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
          img: `uploads/${req.file.filename}`,
        })
        .then(() => {
          db.close();
          res.redirect('/zoeken');
        })
        .catch(err => {
          console.log(err);
        });
    }
  });
}

// Wijzigingen doorvoeren
app.post('/wijzigen', uploadWijzig.single('wijzigimage'), wijzigen);

async function wijzigen(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  const email = req.body.wijzigemail;

  client.connect((err, db) => {
    if (err) throw err;
    db.db('TechTeam')
      .collection('gebruikers')
      .findOneAndUpdate(
        { email: email },
        {
          $set: {
            naam: req.body.wijzignaam,
            leeftijd: req.body.wijzigleeftijd,
            email: req.body.wijzigemail,
            wachtwoord: req.body.wijzigwachtwoordaanmelden,
            telefoon: req.body.wijzigtelefoon,
            console: req.body.wijzigconsole,
            bio: req.body.wijzigbio,
            game1: req.body.wijziggame1,
            game2: req.body.wijziggame2,
            game3: req.body.wijziggame3,
            game4: req.body.wijziggame4,
            img: req.file.filename,
          },
        }
      )
      .then(() => {
        var mailOpties = {
          from: 'gamebuddyteamtech@gmail.com',
          to: email,
          subject: 'GameBuddy App - Accountwijziging',
          text: 'Je GameBuddy account is gewijzigd!',
          attachments: [
            {
              filename: 'Logo.png',
              path: __dirname + '/public/img/logo.ico',
              cid: 'logo',
            },
          ],
        };

        mailer(mailOpties);
        db.close();
        res.redirect('/wijzigenbericht');
      })
      .catch(err => {
        console.log(err);
        res.redirect('/error');
      });
  });
}

/*  Met de functie verwijderen worden documenten verwijderd uit de database.
    Dit wordt gedaan met findOneAndDelete waarbij het object verwijderd wordt aan de hand van de email van de gebruiker.*/
app.post('/verwijderen', verwijderen);

function verwijderen(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  const email = req.body.verwijderemail;

  client.connect((err, db) => {
    const collection = db.db('TechTeam').collection('gebruikers');
    collection
      .find({ email: email }, { $exists: true })
      .toArray(function (err, doc) {
        if (doc.length === 0) {
          res.redirect('/verwijderennotfound');
        } else if (doc) {
          var mailOpties = {
            from: 'gamebuddyteamtech@gmail.com',
            to: email,
            subject: 'GameBuddy App - Accountwijziging',
            text: 'Je GameBuddy account is verwijderd! Maak hier opnieuw een account aan ->',
            attachments: [
              {
                filename: 'Logo.png',
                path: __dirname + '/public/img/logo.ico',
                cid: 'logo',
              },
            ],
          };

          mailer(mailOpties);
          collection.deleteMany({ email: email });
          res.redirect('/verwijderenbericht');
        }
      });
  });
}

// Functie die mail opties meekrijgt en alleen de mail verstuurd naar de gebruiker
function mailer(Optie) {
  transporter.sendMail(Optie, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

//function logout post
function logoutPost(req, res) {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('dashboard');
    } else {
      res.redirect('/');
    }
  });
}
// function render dashboard
function renderDashboard(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  let { userId } = req.session;
  if (!userId) {
    res.redirect('inloggen');
  } else {
    client.connect((err, db) => {
      if (err) throw err;

      db.db('TechTeam')
        .collection('gebruikers')
        .findOne({ naam: req.session.naam })
        .then(() => {
          res.render('dashboard', { gebruikersLijst: req.session.userId });
          console.log(req.session.userId);
          db.close();
        });
    });
  }
}

//function render inloggen
function renderInloggen(req, res) {
  let { userId } = req.session;
  if (!userId) {
    res.render('inloggen');
  } else {
    res.redirect('dashboard');
  }
}
//function post inloggen with session
function inloggenPost(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  client.connect((err, db) => {
    let gebruikers = db.db('TechTeam').collection('gebruikers');
    const email = req.body.emailInloggen;
    const password = req.body.wachtwoordInloggen;

    if (email && password) {
      gebruikers.findOne(
        {
          email: email,
          wachtwoord: password,
        },
        (err, data) => {
          if (err) {
            next(err);
          } else {
            req.session.userId = data;
            res.redirect('/dashboard');
          }
        }
      );
    }
  });
}

//404
app.use(function (req, res) {
  res.status(404).render('404');
});

//app geeft de port terug
app.listen(port, () => {
  console.log(`Server is aan http://localhost:5000`);
});
