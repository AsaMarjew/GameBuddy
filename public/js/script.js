//Knop variabels
var filterKnop = document.querySelector('#filter');
var filterForm = document.querySelector('#filteren');
var filterSluit = document.querySelector('#filterensluiten');

//functies aanroepen
if (filterKnop) {
  filterKnop.addEventListener('click', openFilter);
  filterSluit.addEventListener('click', sluitFilter);
}

//CSS display block
function openFilter() {
  filterForm.style.display = 'block';
}

//CSS display none
function sluitFilter() {
  filterForm.style.display = 'none';
}

// When JS is enabled, fallback text gets replaced by FA

// Home
let homeEl = document.getElementById('pe-fallback-home');
homeEl.innerHTML = '<i class="fas fa-home"></i>';

// // // Zoeken
homeEl = document.querySelector('#pe-fallback-zoeken');
homeEl.innerHTML = '<i class="fas fa-gamepad"></i>';

// // // Favorieten
homeEl = document.querySelector('#pe-fallback-favo');
homeEl.innerHTML = '<i class="fas fa-heart"></i>';
