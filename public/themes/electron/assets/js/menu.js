$(function() {
	var  result = location.pathname;
	var arr = result.split("/");
    var str = "/" + arr[1] + "/" + arr[2] + "/index";
	$('ul.metismenu li a[href="' + str + '"]').parent().addClass('active');
	$('ul.nav-second-level li a[href="' + str + '"]').parent().parent().addClass('in');
	$('ul.nav-second-level li a[href="' + str + '"]').parent().parent().parent().addClass('active');
	
	$('ul.metismenu ul.dropdown-menu li').removeClass('active');
});
