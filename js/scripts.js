jQuery(function () {
	jQuery('section.content input[type="checkbox"]').change(function () {
		var current = jQuery(this);
		var curSelected = jQuery('section.content .article-content input[type="checkbox"]:checked');
		var articleWrappers = jQuery('section.content .article-content');
		articleWrappers.each(function () {
			if(jQuery(this)[0] != current.parent()[0]) {
				jQuery(this).removeClass('open');
			}
		});
		if( curSelected.length > 0 ) {
			current.parent().addClass('open');
		} else {
			current.parent().removeClass('open');
		}
		if( curSelected.length > 1 ) {
			curSelected.each(function () {
				if(jQuery(this)[0] != current[0]) {
					jQuery(this).attr('checked', false);
				}
			});
		}
	});
	
	var articleWidth = jQuery('#en_site .slider').parent().width();
	jQuery('.slider .slider-wrapper').each( function () {
		var sliderWrapper = jQuery(this);
		var nArticles = sliderWrapper.find('article').length;
		sliderWrapper.css('width', articleWidth*nArticles+'px');
		sliderWrapper.find('article').each(function () {
			jQuery(this).css('width', 100.0/nArticles+'%');
		});
		setTimeout(function () {
			moveSlider(sliderWrapper);
		}, 10000);
	});

	jQuery('form input[type=submit]').click(function (e) {
		e.preventDefault();
		submitForm(this);
	});

	decryptEmails();

	jQuery('form input[type=text]').first().val(getCookieValue('usr'));
	jQuery('form input[type=password]').first().val(getCookieValue('pass'));
	if(getCookieValue('usr') != '' && getCookieValue('pass') != '') {
		jQuery('form').each( function () {
			submitForm(jQuery(this).find('input[type=submit]'), true);
		});
	}
});

function moveSlider(sliderWrapper) {
	var nArticles = sliderWrapper.find('article').length;
	var articleWidth = sliderWrapper.parent().css('width').substring(0, sliderWrapper.parent().css('width').length-2);
	sliderWrapper.animate({
		left: '-='+articleWidth+'px'
	}, 500, function () {
		var firstToLast = sliderWrapper.find('article').first().remove();
		sliderWrapper.append(firstToLast);
		sliderWrapper.css('left', '0px');
		setTimeout(function () {
			moveSlider(sliderWrapper);
		}, 10000);
	});
}

function getEncryptedEmail(email) {
	console.log(CryptoJS.AES.encrypt(email, "Candidates4YouEmail").toString());
}

function decryptEmails() {
	jQuery('a[data-email]').each(function () {
		var email = jQuery(this).attr('data-email');
		email = CryptoJS.AES.decrypt(email, "Candidates4YouEmail");
		jQuery(this).attr('href', 'mailto:' + email.toString(CryptoJS.enc.Utf8));
		jQuery(this).text(email.toString(CryptoJS.enc.Utf8));
	});
}

function getUsernamePassword(usr, pass) {
	return { "\"0\"" : CryptoJS.MD5(usr).toString(CryptoJS.enc.Hex), "\"1\"" : CryptoJS.MD5(pass).toString(CryptoJS.enc.Hex) };
}

function getEncryptedCandidateWithPdf(name, pdf, level) {
	console.log({ "\"name\"" : name, "\"level\"" : level , "\"pdf\"" : CryptoJS.AES.encrypt('pdf/'+pdf, "Candidates4YouPDF").toString() });
}

function submitForm(obj, flag) {
	obj = jQuery(obj);
	checkLogin(obj.prev().prev(), obj.prev(), flag);
}

function checkLogin(usr, pass, flag) {
	var usrStr = flag ? usr.val() : CryptoJS.MD5(usr.val()).toString(CryptoJS.enc.Hex);
	var passStr = flag ? pass.val() : CryptoJS.MD5(pass.val()).toString(CryptoJS.enc.Hex);
	jQuery.getJSON( "/js/usrs.json", function (data) {
		var flag = true;
		for( var i in data ) {
			if(data[i][0] == usrStr && data[i][1] == passStr) {
				usr.siblings('.error-message').addClass('hidden');
				jQuery('section.content .login-form form').fadeOut(500);
				setTimeout(function () {
					jQuery('section.content .login-form form').css('display', 'none');
					jQuery('section.content .login-form label').fadeIn(500);
				}, 500);
				jQuery('.candidate-list').each( function () {
					loadCandidates( jQuery(this) );
				});

				var d = new Date();
    			d.setTime(d.getTime() + (7*24*60*60*1000));
				document.cookie = 'usr=' + usrStr + '; expire=' + d.toUTCString();
				document.cookie = ' pass=' + passStr + '; expire=' + d.toUTCString();
				flag = false;
				break;
			}
		}
		if(flag) {
			usr.siblings('.error-message').removeClass('hidden');
		}
	});
}

function loadCandidates( obj ) {
	jQuery.getJSON( "/js/cand_pdfs.json", function (data) {
		var candidatesList;
		for( var i in data ) {
			if(data[i].candidates.length > 0) {
				candidatesList = jQuery('<article class="row"></article>');
				candidatesList.append(jQuery('<h3>' + data[i].category + '</h3>'));
				var list = jQuery('<ul class="col-sm-6"></ul>');
				for( var j in data[i].candidates ) {
					if(data[i].candidates.length > 5 && j == parseInt((data[i].candidates.length+1)/2, 10)) {
						candidatesList.append(list);
						list = jQuery('<ul class="col-sm-6"></ul>');
					}
					list.append(jQuery('<li><a href="' + CryptoJS.AES.decrypt(data[i].candidates[j].pdf, "Candidates4YouPDF").toString(CryptoJS.enc.Utf8) + '" target="_blank">' + data[i].candidates[j].name + (typeof data[i].candidates[j].level != 'undefined' ? ' (' + data[i].candidates[j].level + ')' : '') + '</a></li>'));
				}
				candidatesList.append(list);
				obj.append(candidatesList);
			}
		}
	});
}

function getCookieValue(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}