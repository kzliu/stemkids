$(document).ready(function() {
	$('.tabs .tab .caption').on('click', function(e) {
		e.preventDefault();

		$('.tabs .tab').removeClass('current');
		$(this).parent('.tab').addClass('current');
	});

	$('.header #nav-btn').on('click', function(e) {
		e.preventDefault();

		$('.header .nav').toggleClass('show');
	});
});