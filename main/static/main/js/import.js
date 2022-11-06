$(document).ready(function(){
	var dropZone = $('#upload-container');

	$('#file-input').focus(function() {
		$('label').addClass('focus');
	})
	.focusout(function() {
		$('label').removeClass('focus');
	});


	dropZone.on('drag dragstart dragend dragover dragenter dragleave drop', function(){
		return false;
	});

	dropZone.on('dragover dragenter', function() {
		dropZone.addClass('dragover');
	});

	dropZone.on('dragleave', function(e) {
		let dx = e.pageX - dropZone.offset().left;
		let dy = e.pageY - dropZone.offset().top;
		if ((dx < 0) || (dx > dropZone.width()) || (dy < 0) || (dy > dropZone.height())) {
			dropZone.removeClass('dragover');
		}
	});

	dropZone.on('drop', function(e) {
		dropZone.removeClass('dragover');
		let files = e.originalEvent.dataTransfer.files;
		sendFiles(files);
	});

	$('#file-input').change(function() {
		let files = this.files;
		sendFiles(files);
	});

/* ajax
 */	function sendFiles(files) {
		let maxFileSize = 5242880;
		let Data = new FormData();
		$(files).each(function(index, file) {
			if ((file.size <= maxFileSize) && ((file.type == 'image/png') || (file.type == 'image/jpeg'))) {
				Data.append('images[]', file);
			};
		});

		$.ajax({
			url: dropZone.attr('action'),
			type: dropZone.attr('method'),
			data: Data,
			contentType: false,
			processData: false,
			success: function(data) {
				alert ('Файлы были успешно загружены!');
			}
		});
	}
})

$(document).ready(function(){
    $('#markup').hide(0);   
	$('#generation').hide(0);  
	$('#newTask').hide(0); 
	$('#newTask2').hide(0); 
	$('#generation').hide(0);     
    $('#clicker').click(function(evt){
        $('#markup').fadeIn(1000);   
    })
})

$(document).ready(function(){ 
    $('#clicker').click(function(evt){
		$('#generation').hide(0);     
        $('#markup').fadeIn(1000);   
    })
})

$(document).ready(function(){ 
    $('#clickur').click(function(evt){
		$('#markup').hide(0);     
        $('#generation').fadeIn(1000);   
    })
})

$(document).ready(function(){ 
    $('#addrow').click(function(evt){
		$('#newTask').fadeIn(1000);   
    })
	$('#addrow2').click(function(evt){
		$('#newTask2').fadeIn(1000);   
    })
})




 





