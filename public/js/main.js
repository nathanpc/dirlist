// main.js
// Tabbed JS.

var onload = function () {
	dirlist.load_roots(true);
}

var human_size = function (bytes, precision) {
	var sizes = ["bytes", "kB", "MB", "GB", "TB"];
	var size = "0 bytes";

	if (precision === undefined) {
		precision = 4;
	}

	if (bytes !== 0) {
		var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		size = (bytes / Math.pow(1024, i)).toPrecision(precision) + ' ' + sizes[i];
	}

	return size;
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
			a.innerHTML = roots[i];
			a.onclick = function () {
				dirlist.select_root(this.innerHTML);
			}

			li.appendChild(a);
			menu.appendChild(li);
		}

		if (auto_open) {
			var auto_root = localStorage.getItem("root");
			if (auto_root === null) {
				auto_root = roots[0];
			}

			dirlist.select_root(auto_root);
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

	// Save it.
	localStorage.setItem("root", root);
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
		a.innerHTML = folders[i];
		a.onclick = function () {
			dirlist.load_folder(this.getAttribute("id"));
		}

		li.appendChild(a);
		path_label.appendChild(li);
	}
}

/**
 *  Go up in the directory tree.
 */
dirlist.up = function () {
	var folders = dirlist.current.path.split("/");
	folders = folders.slice(0, folders.length - 1);
	var path = folders.join("/");

	// Root path.
	if (path === "") {
		path = "/";
	}

	dirlist.load_folder(path);
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
 *  Show the preview modal.
 *
 *  @param item JSON item.
 */
dirlist.show_preview = function (item) {
	// Set the title.
	document.getElementById("preview-title").innerHTML = item.name.replace(/\.[\w]+$/i, "");

	// Stuff in the body.
	var modal = document.getElementById("preview-body");
	modal.innerHTML = "";

	// Media to preview.
	if (item.type === "image" || item.type === "video" || item.type === "audio") {
		var container = document.createElement("div");
		container.setAttribute("class", "media-preview-container");

		var media;
		if (item.type === "image") {
			media = document.createElement("img");
		} else if (item.type === "video") {
			media = document.createElement("video");
			media.setAttribute("controls", "controls");
		} else if (item.type === "audio") {
			media = document.createElement("audio");
			media.setAttribute("controls", "controls");
		}

		// General attributes.
		media.setAttribute("class", "media");
		media.setAttribute("src", item.href);

		// Append it.
		container.appendChild(media);
		modal.appendChild(container);
	}

	// File name.
	var name = document.createElement("div");
	name.setAttribute("class", "filename");
	name.innerHTML = item.name;
	modal.appendChild(name);

	// File size.
	var size = document.createElement("div");
	size.setAttribute("class", "size");
	size.innerHTML = human_size(item.size, 6);
	modal.appendChild(size);

	// Extra data.
	if (item.extra !== undefined) {
		var container = document.createElement("div");
		container.setAttribute("class", "extra-container");
		var extra = document.createElement("ul");

		// Do it this way to have a better organization than the random sort of Perl's hashes.
		var categories = [];
		if (item.type === "image") {
			categories = ["Camera", "Image", "Other", "Unknown"];
		} else if (item.type === "video") {
			//categories = ["General", "Specifications"];
			categories = ["Specifications"];
		} else if (item.type === "audio") {
			// TODO: Audio.
		} else {
			// What the fuck would this be?
			for (var key in item.extra) {
				categories.push(key);
			}
		}

		// Loop through the categories and populate the list.
		for (var i = 0; i < categories.length; i++) {
			var category = document.createElement("li");
			category.innerHTML = "<b>" + categories[i] + "</b>";

			var prop = item.extra[categories[i].toLowerCase()];
			var nested = document.createElement("ul");
			nested.setAttribute("class", "nested");

			for (var key in prop) {
				if (prop.hasOwnProperty(key)) {
					var li = document.createElement("li");
					li.innerHTML = "<b>" + key + "</b> " + prop[key];

					nested.appendChild(li);
				}
			}

			category.appendChild(nested);
			extra.appendChild(category);
		}

		container.appendChild(extra);
		modal.appendChild(container);
	}

	// Set the button action.
	document.getElementById("preview-button").onclick = function () {
		window.open(item.href, "_blank");
	}

	$("#preview-modal").modal("show");
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
	var size = human_size(item.size);

	var box = document.createElement("div");
	box.setAttribute("class", "box");
	box.setAttribute("title", item.name);
	if (item.type === "directory") {
		box.onclick = function () {
			var name = this.getElementsByClassName("name")[0].getAttribute("id");
			var item = dirlist.current.contents.contents[name];

			dirlist.load_folder(dirlist.current.path + "/" + item.name);
		}
	} else {
		box.onclick = function () {
			var name = this.getElementsByClassName("name")[0].getAttribute("id");
			var item = dirlist.current.contents.contents[name];

			console.log("Preview: " + item.name);
			console.log(item);
			dirlist.show_preview(item);
		}
	}

	var img = document.createElement("img");
	if (item.thumbnail !== undefined) {
		icon = item.thumbnail;
		img.setAttribute("class", "img-thumbnail");
	}
	img.setAttribute("src", icon);
	box.appendChild(img);

	var lbl_name = document.createElement("div");
	lbl_name.setAttribute("class", "name");
	lbl_name.setAttribute("id", id);
	lbl_name.innerHTML = item.name;
	box.appendChild(lbl_name);

	var lbl_size = document.createElement("div");
	lbl_size.setAttribute("class", "size");
	lbl_size.innerHTML = size;
	box.appendChild(lbl_size);

	return box;
}