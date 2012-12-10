//connect io
var socket = io.connect();

//document ready
$(document).ready(function(){
	//ajax call to get first three tweets
	$.ajax('/twitter', {
		type: 'GET',
		dataType: 'json',
		success: function(data){
			data.count.forEach(function(i){
				$('div.empty').append('<li class="tweet"><img class="userpic" src="' + data.pics[i] + '"/><p class= "username">' + data.name[i] + '</p><p class="handle">@' + data.handle[i] + '</p><p class="tweettext">' + data.text[i] + '</p></li>');
			});	
		},
		error: function(){
			alert('shit went CRAY!')
		}
	});
	
	//socket streaming new tweets
	socket.on('tweet', function (data){ 
        $('li.tweet:last').fadeOut('1500', function(){
        	$('<li class="tweet"><img class="userpic" src="' + data.pics + '"/><p class= "username">' + data.name + '</p><p class="handle">@' + data.handle + '</p><p class="tweettext">' + data.text + '</p></li>').hide().prependTo('div.empty').fadeIn('1500');
        	$(this).remove();
        });
    });
	
	//slider function
	function homepageslider(){
		var stopper = setInterval(function(){slider()}, 5500);
		var i = 0;
		var width = 1000;
		var marginleft = 0;
		//slider if basically moving margin left
		function slider(){	
			if (marginleft == 0) {
				marginleft += width;
				$('#inner').animate({ "margin-left": -marginleft}, 500);
			} else if (marginleft == width) {
				marginleft += width;
				$('#inner').animate({ "margin-left": -marginleft}, 500);
			} else if (marginleft == (width * 2)){
				marginleft = 0;
				$('#inner').animate({ "margin-left": -marginleft}, 500);
			}
		}
		$('#slider').mouseout(function(){
			stopper = setInterval(function(){slider()}, 4000);
		});
		$('#slider').mouseover(function(){
			clearInterval(stopper);
		})
	}
	
	//call slider
	homepageslider();
	
	//form sending via AJAX
	function submitform (e){
		e.preventDefault();
		$('.signup h1').slideUp();
		var form = $(this).serialize();
		$.ajax('/mailer', {
			data: form,
			dataType: 'script',
			type: 'post'
		});
	}

	//call it when form submits
	$('form.signup').submit(submitform);
})