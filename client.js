var socket = io.connect();

editor.on('change', (self,obj) => {
	console.log(obj);
});