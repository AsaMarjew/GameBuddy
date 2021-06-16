<img src="https://user-images.githubusercontent.com/34505894/117519819-99384b00-afa5-11eb-975a-19932dbe1c1b.png" height="100" />


# Game Buddy 🎮

## Over Game Buddy
Game Buddy is een app waarbij mensen die de zelfde games spelen met elkaar in contact kunnen komen. De gebruikers kunnen andere gebruikers als favoriet toevoegen. De gebruiker regirstreet zich en vult zijn gegevens in. De gebruiker vult 4 games in die hij/zij speelt. Daarna komt de oproep van de gebruiker in de dashboard van de app terecht, waarbij andere mensen dat kunnen zien. Mensen kunnen dan de oproep als favoriet toevoegen. Als iemand de oproep ziet en de zelfde games speelt, kan de gebruiker op de nummer klikken die op de oproep staat en zo kunnen de gebruikers met elkaar in contact komen en samen gamen.<br/>

## Hoe werkt het
Een gebruiker klikt op de knop 'Registreren'. Vervolgens vult de gebruiker een formulier in en vult zijn naam, leeftijd, email, telefoonnummer, console, een bio, een profielfoto en favoriete 4 games die de gebruiker speelt. Dan klikt de gebruiker op de aanmelden knop en wordt zijn gegevens in een card verwerkt en komt het terecht in de dashboard van de app. Hier kunnen andere gebruikers van de app zijn oproep zien en als favoriet toevoegen. Ook kunnen andere gebruikers in contact komen om op de nummer te klikken.<br/>


## Schermen / Features
![wireflow1](https://user-images.githubusercontent.com/34505894/118870886-4f296080-b8e7-11eb-99d8-e62fed8670c7.png) <br/><br/>

![wireflow2](https://user-images.githubusercontent.com/34505894/118870903-518bba80-b8e7-11eb-8d71-b73fe1b03000.png)<br/>

<br/>

## Features list 🖇
* Inloggen
* Registreren
* Verwijderen gegevens
* Wijzigen gegevens
* Filteren
 
<br/>

## Topics list 🖇
* API Renderen
* Compression en Minification
* NodeMailer
* Sessions
 
<br/>

## Wiki
Lees de <a href="https://github.com/AsaMarjew/GameBuddy/wiki">wiki</a> voor meer informatie over de app 📖

<br/>

## Installeren
1. Clone de repository<br/>
```
  git clone https://github.com/AsaMarjew/GameBuddy.git
```

2. Navigeer naar het project<br/>
```
  cd GameBuddy
```

3. Installeer NPM<br/>
```
  npm install
```

4. Verander de naam van het bestand .env-example naar .env<br/>

5. Maak een database aan bij MongoAtlas met een tabel genaamd gebruiker<br/>
(https://www.mongodb.com/cloud/atlas)

6. Verander de DB_KEY en de SESSION_SECRET in de .env bestand.<br/>
```
DB_KEY= <jouw db link>
SESSION_SECRET= <jouw geheime token>
```

7. Start de app 🚀<br/>
```
  npm start
```
<br/>

## Dependencies
* Express
* Express-EJS-Layouts
* Express-fileupload
* Express-router
* Express-session
* MongoDB
* Connect-mongodb-session
* EJS
* ESlint
* Dotenv
* Bodyparser
* Multer
* Node Fetch
* AOS.JS
* Font-Awesome
* Google Fonts
<br/>

## Ontwikkelaars
De ontwikkelaars van dit project zijn:
* <a href="https://github.com/muhammet075">Muhammet Kömür</a>
* <a href="https://github.com/PhilipvEgmond">Philip van Egmond</a>
* <a href="https://github.com/kiara1404">Kiara Broekhuizen</a>
* <a href="https://github.com/AsaMarjew">Asa Marjew</a>

<br/>

## License
Dit project heeft een <a href="https://github.com/AsaMarjew/GameBuddy/blob/main/LICENSE">MIT</a> license ✅

