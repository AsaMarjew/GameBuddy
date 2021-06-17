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
  }
});

// Bericht account bestaat al route
app.get('/accountbestaatal', (req, res) => {
  res.render('accountbestaatal');
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
    res.render('wijzigen');
  }
});

//verwijderen route
app.get('/verwijderen', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.render('verwijderen');
  }
});

// Weergave van de pagina email komt niet overeen
app.get('/emailbericht', (req, res) => {
  let { userId } = req.session;
  if (!userId) {
    res.render('index');
  } else {
    res.render('emailbericht');
  }
});

// Weergave van de account is gewijzigd pagina
app.get('/wijzigenbericht', (req, res) => {
  res.render('wijzigenbericht');
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

//routing redirect

// --- END ROUTING LOGIN ---

// --- post ---

// filter post
app.post('/zoeken', handleZoeken);
app.post('/favorieten', handleFavorietenVerwijderen);
app.post('/aanmelden', upload.single('image'), handleAanmelden);

// Wijzigen post
app.post('/wijzigen', uploadWijzig.single('wijzigimage'), handleWijzigen);

// Verwijderen post
app.post('/verwijderen', handleVerwijderen);

// -- routing functions --

async function renderZoeken(req, res) {
  let { userId } = req.session;
  if (!userId) {
    res.redirect('inloggen');
  } else {
    try {
      const client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });
      client.connect(async (err, db) => {
        if (err) throw err;

        const gebruikersCol = db.db('TechTeam').collection('gebruikers');

        // haal de huidige gebruiker op en een array van alle gebruikers
        let users = await gebruikersCol.find().toArray();
        const user = await gebruikersCol.findOne({
          email: req.session.userId.email,
        });

        // maak nieuwe array waar opgeslagen gebruikers niet instaan
        let undiscoveredUsers = users.filter(gebruiker => {
          return !user.favorieten.includes(gebruiker.email);
        });

        res.render('zoeken', { gebruikersLijst: undiscoveredUsers });
        db.close();
      });
    } catch (err) {
      console.log(err);
    }
  }
}

function renderFavorieten(req, res) {
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

      // haal huidige gebruiker op
      const gebruikersCol = db.db('TechTeam').collection('gebruikers');
      gebruikersCol
        .findOne({ email: req.session.userId.email })
        .then(gebruiker => {
          let users = [];
          // push alle favorieten gebruikers in een array
          gebruiker.favorieten.forEach(email => {
            users.push(gebruikersCol.findOne({ email: email }));
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
}

async function renderApi(req, res) {
  // --- fortnite API ---
  //de api wordt gefetcht
  const fortniteApi = await fetch(
    //in deze api zijn sommige items het zelfde daarom word data uit bepaalde items gehaald
    'https://fortnite-api.theapinetwork.com/items/list'
  )
    //de data wordt gerenderd
    .then(res => res.json())
    .then(json => {
      //data in een variabel
      const fortniteData = json.data;

      //session
      let { userId } = req.session;

      //moment van login variabels
      const nietIngelogdKnop = 'Login om te kopen';
      const IngelogdKnop = 'Kopen';
      const ingelogdUrl = 'https://fortnitetracker.com/shop';
      const nietIngelogdUrl = '/inloggen';

      //als niet is ingelogd
      if (!userId) {
        res.render('fortnite', {
          knop: nietIngelogdKnop,
          knopUrl: nietIngelogdUrl,
          fortniteData: fortniteData,
        });

        //als wel is ingelogd
      } else {
        res.render('fortnite', {
          knop: IngelogdKnop,
          knopUrl: ingelogdUrl,
          fortniteData: fortniteData,
        });
      }
    });
}

// -- handle post --

function handleZoeken(req, res) {
  //nieuwe variabel gebruikerEmail uit favorieten
  let gebEmail = req.body.gebruikerEmail;

  //check of de favorieten gebruikerEmail bestaat
  if (gebEmail) {
    handleFavorieten(req, res);
    //als het niet bestaat wordt filteren uitgevoerd ipv favorieten
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

  // voeg gebruikers email aan favorieten van huidige gebruiker toe
  let gebEmail = req.body.gebruikerEmail;

  client.connect(async (err, db) => {
    if (err) throw err;
    db.db('TechTeam')
      .collection('gebruikers')
      .findOneAndUpdate(
        { email: req.session.userId.email },
        { $push: { favorieten: gebEmail } }
      )
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

  // verwijder gebruikers email uit favorieten van huidige gebruiker
  let gebEmail = req.body.gebruikerEmail;

  client.connect(async (err, db) => {
    if (err) throw err;
    db.db('TechTeam')
      .collection('gebruikers')
      .findOneAndUpdate(
        { email: req.session.userId.email },
        { $pull: { favorieten: gebEmail } }
      )
      .then(() => {
        db.close();
      });
  });
  setTimeout(() => {
    res.redirect('back');
  }, 70);
}

// De functie handleAanmelden zorgt ervoor dat het mogelijk is om een nieuwe gebruiker object aan te maken.
// Vervolgens wordt het object opgeslagen in de database.
async function handleAanmelden(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  client.connect((err, db) => {
    const collection = db.db('TechTeam').collection('gebruikers');
    if (err) throw err;
    const email = req.body.email;

    collection
      .find({ email: email }, { $exists: true })
      .toArray(function (err, doc) {
        // Check of er al een account is met het ingevulde mailadres
        if (doc.length === 0) {
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
                res.redirect('/inloggen');
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
                favorieten: [],
              })
              .then(() => {
                db.close();
                res.redirect('/inloggen');
              })
              .catch(err => {
                console.log(err);
              });
          }
          // mailOptions maakt de variabele aan met alle opties die nodig zijn voor het verzenden van een mail.
          // Vervolgens wordt het door de funtie mailer verzonden.
          const mailOptions = {
            from: 'gamebuddyteamtech@gmail.com',
            to: email,
            subject: 'Game Buddy App - Welkom gamer!',
            text: 'Leuk dat je een Game Buddy account hebt aangemaakt! Veel game plezier!',
            attachments: [
              {
                filename: 'Logo.png',
                path: __dirname + '/public/img/logo.ico',
                cid: 'logo',
              },
            ],
          };
          mailer(mailOptions);
        } else if (doc) {
          res.redirect('/accountbestaatal');
        }
      });
  });
}

// De functie handleWijzigen zorgt ervoor dat een account gewijzigd kan worden op basis van de ingevoerde email.
// De document gegevens worden geheel gewijzigd in de database.
async function handleWijzigen(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  const wijzigemail = req.body.wijzigemail;

  client.connect((err, db) => {
    if (err) throw err;
    const collection = db.db('TechTeam').collection('gebruikers');
    collection.findOne({ email: req.session.userId.email }, function () {
      if (req.session.userId.email === wijzigemail) {
        if (req.body.img) {
          collection
            .findOneAndUpdate(
              { email: wijzigemail },
              {
                $set: {
                  naam: req.body.wijzignaam,
                  leeftijd: req.body.wijzigleeftijd,
                  email: req.body.wijzigemail,
                  wachtwoord: req.body.wijzigwachtwoord,
                  telefoon: req.body.wijzigtelefoon,
                  console: req.body.wijzigconsole,
                  bio: req.body.wijzigbio,
                  game1: req.body.wijziggame1,
                  game2: req.body.wijziggame2,
                  game3: req.body.wijziggame3,
                  game4: req.body.wijziggame4,
                  img: req.body.img,
                  favorieten: [],
                },
              }
            )
            .then(() => {
              // mailOptions maakt de variabele aan met alle opties die nodig zijn voor het verzenden van een mail.
              // Vervolgens wordt het door de funtie mailer verzonden.
              const mailOptions = {
                from: 'gamebuddyteamtech@gmail.com',
                to: req.session.userId.email,
                subject: 'Game Buddy App - Accountwijziging',
                text: 'Je Game Buddy account is gewijzigd!',
                attachments: [
                  {
                    filename: 'Logo.png',
                    path: __dirname + '/public/img/logo.ico',
                    cid: 'logo',
                  },
                ],
              };

              mailer(mailOptions);
              db.close();
              req.session.destroy();
              res.redirect('/wijzigenbericht');
            })
            .catch(err => {
              console.log(err);
              res.redirect('/error');
            });
        } else {
          collection
            .findOneAndUpdate(
              { email: wijzigemail },
              {
                $set: {
                  naam: req.body.wijzignaam,
                  leeftijd: req.body.wijzigleeftijd,
                  email: req.body.wijzigemail,
                  wachtwoord: req.body.wijzigwachtwoord,
                  telefoon: req.body.wijzigtelefoon,
                  console: req.body.wijzigconsole,
                  bio: req.body.wijzigbio,
                  game1: req.body.wijziggame1,
                  game2: req.body.wijziggame2,
                  game3: req.body.wijziggame3,
                  game4: req.body.wijziggame4,
                  img: `uploads/${req.file.filename}`,
                  favorieten: [],
                },
              }
            )
            .then(() => {
              // mailOptions maakt de variabele aan met alle opties die nodig zijn voor het verzenden van een mail.
              // Vervolgens wordt het door de funtie mailer verzonden.
              const mailOptions = {
                from: 'gamebuddyteamtech@gmail.com',
                to: req.session.userId.email,
                subject: 'Game Buddy App - Accountwijziging',
                text: 'Je Game Buddy account is gewijzigd!',
                attachments: [
                  {
                    filename: 'Logo.png',
                    path: __dirname + '/public/img/logo.ico',
                    cid: 'logo',
                  },
                ],
              };

              mailer(mailOptions);
              db.close();
              req.session.destroy();
              res.redirect('/wijzigenbericht');
            })
            .catch(err => {
              console.log(err);
              res.redirect('/error');
            });
        }
      } else {
        res.redirect('/emailbericht');
      }
    });
  });
}

//  Met de functie handleVerwijderen worden documenten verwijderd uit de database.
//  Dit wordt gedaan met findOneAndDelete waarbij het object verwijderd wordt aan de hand van de email van de gebruiker.
function handleVerwijderen(req, res) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  const verwijderemail = req.body.verwijderemail;

  client.connect((err, db) => {
    const collection = db.db('TechTeam').collection('gebruikers');
    collection.findOne({ email: req.session.userId.email }, function () {
      if (req.session.userId.email === verwijderemail) {
        // mailOptions maakt de variabele aan met alle opties die nodig zijn voor het verzenden van een mail.
        // Vervolgens wordt het door de funtie mailer verzonden.
        const mailOptions = {
          from: 'gamebuddyteamtech@gmail.com',
          to: req.session.userId.email,
          subject: 'Game Buddy App - Accountwijziging',
          text: 'Je Game Buddy account is verwijderd! Maak hier opnieuw een account aan ->',
          attachments: [
            {
              filename: 'Logo.png',
              path: __dirname + '/public/img/logo.ico',
              cid: 'logo',
            },
          ],
        };

        mailer(mailOptions);
        collection.deleteMany({ email: verwijderemail });
        res.redirect('/index');
      } else {
        res.redirect('/emailbericht');
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
        .findOne({ email: req.session.email })
        .then(() => {
          res.render('dashboard', { gebruikersLijst: req.session.userId });
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
