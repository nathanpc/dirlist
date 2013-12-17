// main.js
// Tabbed JS.

var onload = function () {
	dirlist.load_roots(true);
}

var dirlist = {};

dirlist.current = {
	root: null,
	path: null,
	contents: null
};

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
		root = dirlist.current.root;
	}

	var req = new XMLHttpRequest();
	console.log("Loading path: " + path + " (" + root + ")");

	// Completed
	req.addEventListener("load", function (event) {
		var response = JSON.parse(req.responseText);
		console.log(response);

		// Set the path and populate the grid.
		dirlist.set_path(path, response);
		dirlist.populate_grid(response);
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
	dirlist.current.root = root;
	dirlist.load_folder("/");

	// TODO: History thingy.
}

/**
 *  Sets a working path.
 *
 *  @param path Path to set.
 *  @param contents Folder contents.
 */
dirlist.set_path = function (path, contents) {
	var path_label = document.getElementById("path");
	var folders = null;

	// Remove the last slash in the path string.
	if (path.match(/\/$/) !== null) {
		path = path.substring(0, path.length - 1);
	}

	folders = path.split("/");
	folders[0] = "/";

	// Set the global variables.
	dirlist.current.path = path;
	dirlist.current.contents = contents;
	path_label.innerHTML = "";

	// Populate the menu.
	for (var i = 0; i < folders.length; i++) {
		var li = document.createElement("li");
		var path_arr = folders.slice(0, i + 1);

		// Remove the excess slashes in the beginning for the join.
		if (path_arr.length > 1) {
			path_arr[0] = "";
		}

		var a = document.createElement("a");
		a.setAttribute("href", "#");
		a.setAttribute("id", path_arr.join("/"));
		a.innerText = folders[i];
		a.onclick = function () {
			dirlist.load_folder(this.getAttribute("id"));
		}

		li.appendChild(a);
		path_label.appendChild(li);
	}
}

/**
 *  Sort the grid by.
 *
 *  @param type Sorting type.
 *  @param ascending Sort ascending?
 */
dirlist.sort_by = function (type, ascending) {
	// Save it.
	localStorage.setItem("sort_type", type);
	localStorage.setItem("sort_ascending", ascending.toString());

	// Update the grid.
	dirlist.populate_grid(dirlist.current.contents);
}

/**
 *  Populate the grid.
 *
 *  @param list JSON response from the server.
 *  @param sort Sort by?
 *  @param ascending Sort ascending?
 */
dirlist.populate_grid = function (list, sort, ascending) {
	if (sort === undefined) {
		sort = localStorage.getItem("sort_type");

		// No sort type set.
		if (sort === null) {
			sort = "name";
			localStorage.setItem("sort_type", "name");
		}
	}

	if (ascending === undefined) {
		ascending = localStorage.getItem("sort_ascending");

		// No sort type set.
		if (ascending === null) {
			ascending = "true";
			localStorage.setItem("sort_ascending", "true");
		}

		ascending = JSON.parse(ascending);
	}

	// Sort the list.
	if (sort === "name") {
		// Sort by name.
		list.ids.sort();
	} else if (sort === "size") {
		// Sort by size.
		list.ids.sort(function (a, b) {
			if (list.contents[a].size < list.contents[b].size) {
				return -1;
			} else if (list.contents[a].size > list.contents[b].size) {
				return 1;
			} else {
				return 0;
			}
		});
	}

	// Descending?
	if (!ascending) {
		list.ids.reverse();
	}

	// Clear the grid.
	var grid = document.getElementById("grid");
	grid.innerHTML = "";

	// Populate the grid.
	for (var i = 0; i < list.ids.length; i++) {
		var item = list.contents[list.ids[i]];
		grid.appendChild(dirlist.build_box(list.ids[i], item));
	}
}

/**
 *  Builds a box element.
 *
 *  @param id Item ID.
 *  @param item Item properties.
 *  @return Box element.
 */
dirlist.build_box = function (id, item) {
	// Choose the correct icon.
	var icon = "img/";
	switch (item.type) {
	case "directory":
		icon += "folder.png";
		break;
	case "file":
		icon += "file.png";
		break;
	case "image":
		icon += "image.png";
		break;
	case "video":
		icon += "video.png";
		break;
	case "audio":
		icon += "audio.png";
		break;
	case "pdf":
		icon += "pdf.png";
		break;
	default:
		icon += "file.png";
		break;
	}

	// Human-readable size.
	var sizes = ["bytes", "kB", "MB", "GB", "TB"];
	var size = "0 bytes";
	if (item.size !== 0) {
		var i = parseInt(Math.floor(Math.log(item.size) / Math.log(1024)));
		size = (item.size / Math.pow(1024, i)).toPrecision(4) + ' ' + sizes[i];
	}

	var box = document.createElement("div");
	box.setAttribute("class", "box");
	box.setAttribute("title", item.name);
	if (item.type === "directory") {
		box.onclick = function () {
			var name = this.getElementsByClassName("name")[0].getAttribute("id");
			var item = dirlist.current.contents.contents[name];

			dirlist.load_folder(dirlist.current.path + "/" + item.name);
		}
	}

	var img = document.createElement("img");
	img.setAttribute("src", icon);
	box.appendChild(img);

	var lbl_name = document.createElement("div");
	lbl_name.setAttribute("class", "name");
	lbl_name.setAttribute("id", id);
	lbl_name.innerText = item.name;
	box.appendChild(lbl_name);

	var lbl_size = document.createElement("div");
	lbl_size.setAttribute("class", "size");
	lbl_size.innerText = size;
	box.appendChild(lbl_size);

	return box;
}