// Ophalen van de dingen die we nodig hebben
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();
const port = process.env.PORT || 5000;

// Database Setup
const { MongoClient } = require('mongodb');
const uri = process.env.DB_KEY;
const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

// --- Multer ---

// Afbeeldingen worden opgeslagen in de public/uploads map
const storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, './public/uploads');
  },

  //afbeeldingen krijgen naast de oorspronkelijke naam ook de huidige datum
  filename: function (request, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

// Gewijzigde afbeeldingen worden bijgehouden
const storageWijzig = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, './public/uploads');
  },

  filename: function (request, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

// Uploaden van afbeelding en checken op de formaat limiet
const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
});

// Gewijzigde afbeeldingen uploaden
const uploadWijzig = multer({
  storage: storageWijzig,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
});

// Hier worden de css, img en js map uit de public map gedefinieerd
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public.css'));
app.use('/img', express.static(__dirname + 'public.img'));
app.use('/js', express.static(__dirname + 'public.js'));

// Hier wordt express layout mobiel formaat gebruiken
app.use(expressLayouts);
app.set('layout', './layouts/mobiel-formaat');

// View engine wordt op ejs gezet
app.set('view engine', 'ejs');

// Bodyparser en express.json voor http requests
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

// --- routing ---

// Weergave van de pagina index
app.get('', (req, res) => {
  res.render('index');
});

// Weergave van de pagina aanmelden
app.get('/aanmelden', (req, res) => {
  res.render('aanmelden');
});

// Weergave van de pagina zoeken met de gebruikers/oproepen, die meegestuurd worden vanuit de database
app.get('/zoeken', (req, res) => {
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

// Weergave van de pagina wijzigen
app.get('/wijzigen', (req, res) => {
  res.render('wijzigen');
});

// Weergave van de pagina verwijderen
app.get('/verwijderen', (req, res) => {
  res.render('verwijderen');
});

// Weergave van de verwijderbericht pagina
app.get('/verwijderenbericht', (req, res) => {
  res.render('verwijderenbericht');
});

// Weergave van de verwijdernotfound pagina
app.get('/verwijderennotfound', (req, res) => {
  res.render('verwijderennotfound');
});

// Weergave van de wijzigenbericht pagina
app.get('/wijzigenbericht', (req, res) => {
  res.render('wijzigenbericht');
});

// Weergave van de tutorial pagina
app.get('/hoe-werkt-het', (req, res) => {
  res.render('hoewerkthet');
});

// Weergave van de error pagina
app.get('/error', (req, res) => {
  res.render('error');
});

// --- handle post ---

// Wanneer er een nieuwe oproep geplaatst wordt, wordt de variabel gebruiker gevuld
app.post('/aanmelden', upload.single('image'), async (req, res) => {
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

// Filter optie
app.post('/zoeken', async (req, res) => {
  const consoleFilter = req.body.consolefilter;
  // Een lege query voor als alles aangevingt is
  let query = {};

  if (consoleFilter === 'Alle') {
    query = {};

    // De query met de gekozen fitler optie uit de dropdown in het filter menu
  } else {
    query = {
      console: consoleFilter,
    };
  }

  // Lean zet de query om in Mongo objecten
  const gebruikers = await gebruiker.find(query).lean();

  // De gebruikerslijst en de filter opties worden meegestuurd
  res.render('zoeken', {
    gebruikersLijst: gebruikers,
    consoleFilter,
  });
});

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
          var mailOptions = {
            from: 'gamebuddyteamtech@gmail.com',
            to: 'asa@marjew.nl',
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

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
          collection.deleteMany({ email: email });
          db.close();
          res.redirect('/verwijderenbericht');
        }
      });
  });
}

// Weergave van de 404 pagina
app.use(function (req, res) {
  res.status(404).render('404');
});

// Applicatie geeft de port terug
app.listen(port, () => {
  console.log(`Server is aan http://localhost:5000`);
});
