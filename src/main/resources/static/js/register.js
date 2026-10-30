$(document).ready(function(){
 	
		'use strict'
	
	  // Fetch all the forms we want to apply custom Bootstrap validation styles to
	  const forms = document.querySelectorAll('.needs-validation')
	
	  // Loop over them and prevent submission
	  Array.from(forms).forEach(form => {
	    form.addEventListener('submit', event => {
	      if (!form.checkValidity()) {
	        event.preventDefault()
	        event.stopPropagation()
	      }
	
	      form.classList.add('was-validated')
	    }, false)
	  })
});

function getRandomColor(){
	const letras = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++){
		color += letras[Math.floor(Math.random() * 16)]
	}
	
	document.getElementById("imagenUsuario").value = color;
	
}

// Permite cargar las funciones desde las pruebas automaticas (Jest); en el navegador no tiene efecto.
if (typeof module !== "undefined" && module.exports) {
	module.exports = { getRandomColor };
}
