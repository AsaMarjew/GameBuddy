//.env bestand aanroepen
require("dotenv").config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const app = express();
const port = process.env.PORT || 5000;

//de css, img en js map in de public map gebruiken
app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public.css"));
app.use("/img", express.static(__dirname + "public.img"));
app.use("/js", express.static(__dirname + "public.js"));

//express layout mobiel formaat en ejs gebruiken
app.use(expressLayouts);
app.set("layout", "./layouts/mobiel-formaat");
app.set("view engine", "ejs");

//bodparser en express.json voor http requests
app.use(express.json());
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//afbeeldingen uploaden
var multer = require("multer");

//database connectie
const mongoose = require("mongoose");
const { request } = require("express");

//db variable in de .env bestand aanroepen
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    runValidators: true,
})

//gebruiker schema voor in de database
const gebruikerSchema = new mongoose.Schema({
    naam: {
      type: String,
    },
    leeftijd: {
      type: Number,
    },
    email: {
      type: String,
      unique: true,
    },
    telefoon: {
      type: Number,
    },
    console: {
      type: String,
    },
    bio: {
      type: String,
    },
    game1: {
      type: String,
    },
    game2: {
      type: String,
    },
    game3: {
      type: String,
    },
    game4: {
      type: String,
    },
    img: {}
});

//in de variabel gebruiker bevint zich het schema voor de database
const gebruiker = mongoose.model("gebruiker", gebruikerSchema)


//afbeeldingen worden opgeslagen in de public/uploads map
const storage = multer.diskStorage({
  destination: function (request, file, callback){
    callback(null, "./public/uploads");
  },

//afbeeldingen krijgen naast de oorspronkelijke naam ook de huidige datum
  filename: function (request, file, callback){
    callback(null, Date.now() + file.originalname);
  },

});

//gewijzigde afbeeldingen
const storageWijzig = multer.diskStorage({
  destination: function (request, file, callback){
    callback(null, "./public/uploads");
  },

  filename: function (request, file, callback){
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


//de app begint met de index.ejs bestand
app.get('', (req, res) => {
    res.render("index");
})


//aanmelden route
app.get("/aanmelden", (req, res) => {
    res.render("aanmelden");
})

//als er een nieuwe oproep geplaatst wordt, wordt de variabel gebruiker gevuld
app.post("/aanmelden", upload.single("image"), async (req, res) => {
  console.log(request.file)
    let nieuwGebruiker = new gebruiker({
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
        img: req.file.filename
    });
   
    //de gevulde variable wordt opgeslagen als er een error is wordt de gebruiker doorverwezen naar de error pagina
    nieuwGebruiker.save(function (err) {
      if (err) {
        console.log("error");
        res.redirect("/error");
      } else {
      res.redirect("/zoeken");
      }
    })
})


//zoeken route en gebruikers/oproepen in database vinden en mee sturen naar zoeken pagina
app.get("/zoeken", (req, res) => {
  gebruiker.find({}, function(err, gebruikers) {
      res.render("zoeken", {
          gebruikersLijst: gebruikers
      })
  })
})

//filter optie
app.post("/zoeken", async (req, res) => {

  const consoleFilter = req.body.consolefilter
  //lege query voor als alle aangevingt is
  let query = {}

  if (consoleFilter === "Alle") {
    query = {}

  //query met de gekozen fitler optie uit de dropdown in de filter menu 
  } else {
      query = {
      console: consoleFilter
    }
  }

  //lean zet het om in mongo objecten
  const gebruikers = await gebruiker.find(query).lean()

  //gebruikerslijst sturen en de filter optie
  res.render("zoeken", {
    gebruikersLijst: gebruikers,
    consoleFilter
  })

})

//wijzigen route
app.get("/wijzigen", (req, res) => {
  res.render("wijzigen");
})

//wijzigingen doorvoeren 
app.post("/wijzigen", uploadWijzig.single("wijzigimage"), async (req, res) => {
  try {
    //zoeken naar de juiste gebruiker aan de hand van de email die de gebruiker invoert
    const doc = await gebruiker.findOne({ email: req.body.wijzigemail });
      doc.overwrite({     
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
        img: req.file.filename
      });

    //de updates worden opgeslagen
    await doc.save();
    res.redirect("/zoeken");

  //bij een error wordt de gebruiker doorverwezen naar de error pagina
  } catch(err) {
  console.log(err);
  res.redirect("/error");
  }
})


//verwijderen route
app.get("/verwijderen", (req, res) => {
  res.render("verwijderen")
})

app.post("/verwijderen", async (req, res) => {
  try {
    //met deletemany worden alle records van de object verwijderd, aan de hand van de email
    await gebruiker.deleteMany({
      email: req.body.verwijderemail,
  })

  res.redirect("/zoeken");

  } catch (err) {
    res.redirect("/error");
  } 
})


//tutorial route
app.get("/hoe-werkt-het", (req, res) => {
  res.render("hoewerkthet")
})


//error route
app.get("/error", (req, res) => {
  res.render("error")
})


//404
app.use(function(req, res) {
  res.status(404).render("404");
});


//app geeft de port terug
app.listen(port, () => {
    console.log("Server is aan");
}) 