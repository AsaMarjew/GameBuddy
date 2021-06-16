
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
