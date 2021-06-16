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
