console.log("Helloww");

//AOS
AOS.init({
    offset: 200,
    duration: 500,
    easing: 'ease-in-quad',
    delay: 100,
});

//Knop variabels
var filterKnop = document.querySelector("#filter");
var filterForm = document.querySelector("#filteren");
var filterSluit = document.querySelector("#filterensluiten");

//functies aanroepen
filterKnop.addEventListener("click", openFilter);
filterSluit.addEventListener("click", sluitFilter);

//CSS display block
function openFilter(){
    filterForm.style.display = "block";
};

//CSS display none
function sluitFilter(){
    filterForm.style.display = "none";
};
