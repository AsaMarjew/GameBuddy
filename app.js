require("dotenv").config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');

//afbeeldingen uploaden
const multer = require("multer");
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;
// require mongo-db


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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// database connectie mongo-db


//routing
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


