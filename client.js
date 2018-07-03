var socket = io.connect();
var global_lamport = 1;
var global_site;
var global_role;
var C = CRDT();
var head = document.getElementById("head");
var container = document.getElementById("container");
var converter = new showdown.Converter();
var availSpaces = [];

var editor = CodeMirror.fromTextArea(document.getElementById("wyj"), {
    lineNumbers: true,     // 显示行号
        indentUnit: 4,         // 缩进单位为4
        styleActiveLine: true, // 当前行背景高亮
        matchBrackets: true,   // 括号匹配
        lineWrapping: true,    // 自动换行
        theme: 'dracula'      // 编辑器主题
});

socket.emit('join');
socket.on('accept', (site) => {
	global_site = site;
});

socket.on('users', (users) => {
	users = JSON.parse(users);
	head.innerHTML = "";
	users.forEach((role, site)=> {
		if (role !== null) {
			var u = document.createElement("h1");
			u.innerHTML = role + (role === 'admin' ? '' : site);
			if (global_site === site) {
				u.style.color = "#00BFFF";
				global_role = role;
			}
			head.appendChild(u);
		}
	});
	
});

socket.on('init', (changes) => {
	changes.map(C.updateAndConvertRemoteToLocal).forEach(
		localChange => editor.getDoc().replaceRange(localChange.text,
                localChange.from, localChange.to, "ignore")
	);
    if (global_role !== 'admin')
	   availSpaces = C.findAllAvailSpace(global_site);
    container.innerHTML = converter.makeHtml(editor.getValue());
});

socket.on('recvChange', (remoteChange) => {
	global_lamport = Math.max(remoteChange.lamport, global_lamport) + 1;
	const localChange = C.updateAndConvertRemoteToLocal(remoteChange.change);
	if (localChange) {
            editor.getDoc().replaceRange(localChange.text,
                localChange.from, localChange.to, "ignore");
            if (remoteChange.origin === 'admin')
                if (global_role !== 'admin')
            	   availSpaces = C.findAllAvailSpace(global_site);

            container.innerHTML = converter.makeHtml(editor.getValue());
        }

});

editor.on('beforeChange', (self, change) => {
	if (change.origin !== "ignore") {
        change.cancel();

		let changes = [];
    	let _changes = C.convertLocalToRemote(global_lamport, global_site, change);
    	if (global_role === 'admin') {
    		changes = _changes;
    	}
    	else {
    		_changes.forEach(_change => {
    			if (C.isAvail(availSpaces, _change[1]) === 1) {
    				changes.push(_change);
    			}
    		});
    	}
    	if (changes.length > 0) {
    		global_lamport = global_lamport + 1;

    		changes.forEach(_ch => {
    			socket.emit('sendChange',{change : _ch, lamport : global_lamport, origin : global_role});
                const localChange = C.updateAndConvertRemoteToLocal(_ch);
				if (localChange) {
            		editor.getDoc().replaceRange(localChange.text,
                		localChange.from, localChange.to, "ignore");
        		}
    		});
    		if (global_role === 'admin')
                if (global_role !== 'admin')
    			    availSpaces = C.findAllAvailSpace(global_site);
    	}
	}
    container.innerHTML = converter.makeHtml(editor.getValue());
});

