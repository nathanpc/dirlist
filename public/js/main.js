// main.js
// Tabbed JS.

var onload = function () {
	dirlist.load_roots(true);
}

var dirlist = {};

dirlist.current_root = null;
dirlist.current_path = null;

/**
 *  Load the roots list.
 *
 *  @param auto_open Automatically open the first root.
 */
dirlist.load_roots = function (auto_open) {
	var req = new XMLHttpRequest();
	console.log("Loading roots...");

	// Completed
	req.addEventListener("load", function (event) {
		var roots = JSON.parse(req.responseText).roots;
		var menu = document.getElementById("root-menu");
		console.log(JSON.parse(req.responseText));

		// Clear the menu.
		menu.innerHTML = "";

		// Populate the menu.
		for (var i = 0; i < roots.length; i++) {
			var li = document.createElement("li");

			var a = document.createElement("a");
			a.setAttribute("href", "#");
			a.innerText = roots[i];
			a.onclick = function () {
				dirlist.select_root(this.innerText);
			}

			li.appendChild(a);
			menu.appendChild(li);
		}

		if (auto_open) {
			dirlist.select_root(roots[0]);
		}
	}, false);

	// Error
	req.addEventListener("error", function (event) {
		console.log("ERROR!");
		console.log(event);
		console.log(req);

		alert("Error! Couldn't get the roots list");
	}, false);

	// Setup the request.
	req.open("GET", "/roots", true);
	req.send();
}

/**
 *  Load a folder.
 *
 *  @param path Path to the folder.
 *  @param root Root name.
 */
dirlist.load_folder = function (path, root) {
	if (root === undefined) {
		root = dirlist.current_root;
	}

	var req = new XMLHttpRequest();
	console.log("Loading path: " + path + " (" + root + ")");

	// Completed
	req.addEventListener("load", function (event) {
		var response = JSON.parse(req.responseText);
		console.log(response);

		// Set the path.
		dirlist.set_path(path);

		// Populate the grid.
		/*for (var i = 0; i < roots.length; i++) {
			var li = document.createElement("li");

			var a = document.createElement("a");
			a.setAttribute("href", "#");
			a.innerText = roots[i];
			a.onclick = function () {
				console.log("Open root: " + this.innerText);
			}

			li.appendChild(a);
			menu.appendChild(li);
		}*/
	}, false);

	// Error
	req.addEventListener("error", function (event) {
		console.log("ERROR!");
		console.log(event);
		console.log(req);

		alert("Error! Couldn't load path: " + path + " (" + root + ")");
	}, false);

	// Setup the request.
	req.open("GET", "/list?path=" + encodeURIComponent(path) + "&root=" + encodeURIComponent(root), true);
	req.send();
}

/**
 *  Selects a Root.
 *
 *  @param root Root name.
 */
dirlist.select_root = function (root) {
	dirlist.current_root = root;
	dirlist.load_folder("/");
}

/**
 *  Sets a working path.
 *
 *  @param path Path to set.
 */
dirlist.set_path = function (path) {
	var path_label = document.getElementById("path");
	var folders = null;

	// Remove the last slash in the path string.
	if (path.match(/\/$/) !== null) {
		path = path.substring(0, path.length - 1);
	}

	folders = path.split("/");
	folders[0] = "/";

	dirlist.current_path = path;
	path_label.innerHTML = "";

	// Populate the menu.
	for (var i = 0; i < folders.length; i++) {
		var li = document.createElement("li");

		var a = document.createElement("a");
		a.setAttribute("href", "#");
		a.innerText = folders[i];
		a.onclick = function () {
			// TODO: history thingy.
		}

		li.appendChild(a);
		path_label.appendChild(li);
	}
}