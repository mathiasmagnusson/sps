const name_of_item = {
	"8850749311446": "Munkar",
	"7780721820430": "Mjölk",
	"6405090401472": "Fil",
	"7340116870009": "Diverse konserver",
	"7310865003201": "Vispgrädde",
	"1234567890123": "Julmust",
	"7698435798435": "Midsommarmust",
	"7342849038949": "Kattmat",
};

class Item {
	constructor(p) {
		if (typeof p == "string" && p.split('').every(c => /\d/.test(c)) && name_of_item[p]) {
			this.name = name_of_item[p];
			this.barcode = p;
			return;
		} else if (typeof p == "number" && name_of_item[p.toString()]) {
			this.name = name_of_item[p];
			this.barcode = p.toString();
			return;
		} else {
			for (let [barcode, name] of Object.entries(name_of_item)) {
				if (p.toLowerCase() == name.toLowerCase()) {
					this.name = name;
					this.barcode = barcode;
					return;
				}
			}
		}
		throw `Varan "${p}" finns inte.`;
	}
}

class Store {
	constructor(json) {
		json = JSON.parse(json);
		this.verts = json.verts.map(vert => {
			if (vert.items)
				vert.items = vert.items.map(barcode => new Item(barcode));

			return vert;
		});
		this.edges = json.edges;
		this.gfx = json.gfx;
	}
	find_item(item) {
		for (let [i, v] of Object.entries(this.verts)) {
			if (v.items) {
				for (let item_ of v.items) {
					if (item.barcode == item_.barcode) {
						return i;
					}
				}
			}
		}
		return -1;
	}
	path_between_items(item1, item2) {
		return this.path_between_vertices(
			this.find_item(item1),
			this.find_item(item2),
		);
	}
	path_from_entrance_to_item(item) {
		return this.path_between_vertices(
			this.verts.indexOfFn(v => v.entrance),
			this.find_item(item),
		);
	}
	path_from_item_to_checkout(item) {
		return this.path_between_vertices(
			this.find_item(item),
			this.verts.indexOfFn(v => v.checkout)
		)
	}
	path_between_vertices(src, dst) {
		if (src == -1 || dst == -1)
			throw "Undefined src or dst";

		let dist = this.verts.map(() => Infinity);
		let prev = this.verts.map(() => -1);
		let nx = this.verts.map((_, i) => i);

		dist[src] = 0;

		while (nx.length > 0) {
			let min = { value: Infinity, index: -1 };
			for (let [i, v] of Object.entries(nx)) {
				if (dist[v] < min.value) {
					min.value = dist[v];
					min.index = i;
				}
			}

			let u = nx[min.index];
			nx.splice(min.index, 1);

			if (u == dst) {
				let path = [];

				while (u != -1) {
					path.unshift(u);
					u = prev[u];
				}

				return { path, length: dist[dst] };
			}

			for (let { dest: v, weight } of this.edges[u]) {
				let alt = dist[u] + weight;
				if (alt < dist[v]) {
					dist[v] = alt;
					prev[v] = u;
				}
			}
		}

		throw "rip in peperonis, no path found";
	}
	render(ctx, width, height) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, 8, 8);
		ctx.scale(
			width/this.gfx.size.x,
			height/this.gfx.size.y,
		);
		for (let box of this.gfx.boxes) {
			ctx.fillRect(
				box.x,
				box.y,
				box.w,
				box.h,
			);
		}

		for (let [i, vert] of Object.entries(this.verts)) {
			ctx.lineWidth = 0.1;
			ctx.strokeStyle = "red";
			for (let j of this.edges[i].map(e => e.dest)) {
				if (i == j) continue;
				let other = this.verts[j];
				ctx.beginPath();
				ctx.moveTo(vert.x + 0.5, vert.y + 0.5);
				ctx.lineTo(other.x + 0.5, other.y + 0.5);
				ctx.stroke();
				ctx.closePath();
			}
		}

		for (let [i, vert] of Object.entries(this.verts)) {
			ctx.fillStyle = "green";
			ctx.fillRect(vert.x + 0.1, vert.y + 0.1, 0.8, 0.8);
			ctx.fillStyle = "white";
			ctx.font = "0.6px Serif";
			ctx.textBaseline = "middle";

			ctx.fillText(
				vert.entrance ? 'e'
					: vert.checkout ? 'c'
					: i,
				vert.x + 0.21,
				vert.y + 0.3
			);
		}

		ctx.scale(
			this.gfx.size.x/width,
			this.gfx.size.y/height,
		);
	}
}

class ShoppingList {
	constructor() {
		this.items = [];
		this.path = null;
		this.ul = document.querySelector("#shoplist");
	}
	get_fastest_path_in_store(store) {
		if (!store instanceof Store) throw "Man kan bara handra i affärer, inte i en/ett" + typeof store;

		if (this.items.length == 0)
			throw "Du kan gå hem igen, inget att handla!";

		for (let item of this.items)
			if (store.find_item(item) == -1)
				throw `${item.name} finns inte i den här affären, stick iväg!`;

		let perms = lib.all_permutations(this.items);

		let shortest_perm = { value: [], length: Infinity };
		for (let perm of perms) {
			let paths = [store.path_from_entrance_to_item(perm[0])];
			for (let i = 0; i < perm.length - 1; i++) {
				paths.push(store.path_between_items(perm[i], perm[i + 1]));
			}
			paths.push(store.path_from_item_to_checkout(perm[perm.length - 1]));

			let length = paths.map(({ length }) => length).reduce((acc, length) => acc + length);
			if (length < shortest_perm.length) {
				shortest_perm.length = length;
				shortest_perm.value = paths;
			}
		}

		return (this.path = shortest_perm);
	}
	add_item(s) {
		try {
			this.items.push(new Item(s));
			this.update();
			return true;
		}
		catch (e) {
			alert(e);
			return false;
		}
	}
	remove(item) {
		this.items.splice(this.items.indexOf(item), 1);
		this.update();
	}
	update() {
		let ul = this.ul;
		ul.innerHTML = "";
		for (let item of this.items) {
			let li = document.createElement("li");
			li.textContent = item.name;
			li.setAttribute("barcode", item.barcode);
			ul.appendChild(li);
		}
	}
}

let store = new Store(JSON.stringify({
	verts: [
		{ x: 12, y: 15, entrance: true },
		{ x: 12, y: 11, items: [] }, // 1
		{ x: 14, y: 11, items: [] }, // 2
		{ x: 14, y: 14, items: [] }, // 3
		{ x: 10, y: 11, items: [] }, // 4
		{ x: 10, y: 14, items: [] }, // 5
		{ x: 9, y: 14, items: [] }, // 6
		{ x: 7, y: 11, items: [] }, // 7
		{ x: 5, y: 11, items: [] }, // 8
		{ x: 3, y: 11, items: [] }, // 9
		{ x: 1, y: 11, items: [] }, // 10
		{ x: 7, y: 14, items: [] }, // 11
		{ x: 5, y: 14, items: [] }, // 12
		{ x: 3, y: 14, items: [] }, // 13
		{ x: 12, y: 7, items: [] }, // 14
		{ x: 14, y: 7, items: [] }, // 15
		{ x: 14, y: 5, items: [] }, // 16
		{ x: 14, y: 3, items: [] }, // 17
		{ x: 14, y: 1, items: [] }, // 18
		{ x: 12, y: 3, items: [] }, // 19
		{ x: 12, y: 1, items: [] }, // 20
		{ x: 10, y: 1, items: [] }, // 21
		{ x: 10, y: 3, items: [] }, // 22
		{ x: 10, y: 5, items: [] }, // 23
		{ x: 10, y: 7, items: [] }, // 24
		{ x: 10, y: 9, items: [] }, // 25
		{ x: 7, y: 9, items: [] }, // 26
		{ x: 1, y: 9, items: [] }, // 27
		{ x: 1, y: 7, items: [] }, // 28
		{ x: 1, y: 5, items: [] }, // 29
		{ x: 1, y: 3, items: [] }, // 30
		{ x: 1, y: 1, items: [] }, // 31
		{ x: 4, y: 1, items: [] }, // 32
		{ x: 7, y: 1, items: [] }, // 33
		{ x: 7, y: 3, items: [] }, // 34
		{ x: 7, y: 5, items: [] }, // 35
		{ x: 7, y: 7, items: [] }, // 36
		{ x: 4, y: 0, items: [] }, // 37
		{ x: 7, y: 0, items: [] }, // 38
		{ x: 4, y: 9, items: [] }, // 39
		{ x: 4, y: 7, items: [] }, // 40
		{ x: 4, y: 5, items: [] }, // 41
		{ x: 4, y: 3, items: [] }, // 42
		{ x: 9, y: 11, items: [] }, // 43
		{ x: 1, y: 15, checkout: true },
	],
	edges: [
		[
			{ weight: 4, dest: 1 },
		], // e
		[
			{ weight: 4, dest:  0 },
			{ weight: 2, dest:  2 },
			{ weight: 2, dest:  4 },
			{ weight: 4, dest: 14 },
		], // 1
		[
			{ weight: 2, dest: 1 },
			{ weight: 3, dest: 3 },
			{ weight: 4, dest: 15 },
		], // 2
		[
			{ weight: 3, dest: 2 },
		], // 3
		[
			{ weight: 2,        dest: 1 },
			{ weight: 3,        dest: 5 },
			{ weight: Math.sqrt(10), dest: 6 },
			{ weight: 2,        dest: 25 },
			{ weight: 1,        dest: 43 },
		], // 4
		[
			{ weight: 3,        dest: 4 },
			{ weight: 1,        dest: 6 },
			{ weight: Math.sqrt(10), dest: 43 },
		], // 5
		[
			{ weight: Math.sqrt(10), dest: 4 },
			{ weight: 1, dest: 5 },
			{ weight: 3, dest: 43 },
		], // 6
		[
			{ weight: 2, dest: 8 },
			{ weight: 3, dest: 11 },
			{ weight: 2, dest: 26 },
			{ weight: 2, dest: 43 },
		], // 7
		[
			{ weight: 2, dest: 7 },
			{ weight: 2, dest: 9 },
			{ weight: 3, dest: 12 },
		], // 8
		[
			{ weight: 2, dest: 8 },
			{ weight: 2, dest: 10 },
			{ weight: 3, dest: 13 },
		], // 9
		[
			{ weight: 2, dest: 9 },
			{ weight: 2, dest: 27 },
			{ weight: 4, dest: 44 },
		], // 10
		[
			{ weight: 3, dest: 7 },
		], // 11
		[
			{ weight: 3, dest: 8 },
		], // 12
		[
			{ weight: 3, dest: 9 },
		], // 13
		[
			{ weight: 4, dest: 1 },
			{ weight: 2, dest: 15 },
			{ weight: 2, dest: 24 },
		], // 14
		[
			{ weight: 4, dest: 2 },
			{ weight: 2, dest: 14 },
			{ weight: 2, dest: 16 },
		], // 15
		[
			{ weight: 2, dest: 15 },
			{ weight: 2, dest: 17 },
			{ weight: 4, dest: 23 },
		], // 16
		[
			{ weight: 2, dest: 16 },
			{ weight: 2, dest: 18 },
			{ weight: 2, dest: 19 },
		], // 17
		[
			{ weight: 2, dest: 17 },
			{ weight: 2, dest: 20 },
		], // 18
		[
			{ weight: 2, dest: 17 },
			{ weight: 2, dest: 20 },
			{ weight: 2, dest: 22 },
		], // 19
		[
			{ weight: 2, dest: 18 },
			{ weight: 2, dest: 19 },
			{ weight: 2, dest: 21 },
		], // 20
		[
			{ weight: 2, dest: 20 },
			{ weight: 2, dest: 22 },
			{ weight: 3, dest: 33 },
		], // 21
		[
			{ weight: 2, dest: 19 },
			{ weight: 2, dest: 21 },
			{ weight: 2, dest: 23 },
			{ weight: 3, dest: 34 },
		], // 22
		[
			{ weight: 4, dest: 16 },
			{ weight: 2, dest: 22 },
			{ weight: 2, dest: 24 },
			{ weight: 3, dest: 35 },
			{ weight: Math.sqrt(13), dest: 36 },
		], // 23
		[
			{ weight: 2, dest: 14 },
			{ weight: 2, dest: 23 },
			{ weight: 2, dest: 25 },
			{ weight: 3, dest: 35 },
			{ weight: Math.sqrt(13), dest: 36 },
		], // 24
		[
			{ weight: 2, dest: 4 },
			{ weight: 2, dest: 24 },
			{ weight: 3, dest: 26 },
		], // 25
		[
			{ weight: 2, dest: 7 },
			{ weight: 3, dest: 25 },
			{ weight: 2, dest: 36 },
			{ weight: 3, dest: 39 },
		], // 26
		[
			{ weight: 2, dest: 10 },
			{ weight: 2, dest: 28 },
			{ weight: 3, dest: 39 },
		], // 27
		[
			{ weight: 2, dest: 27 },
			{ weight: 2, dest: 29 },
			{ weight: 3, dest: 40 },
		], // 28
		[
			{ weight: 2, dest: 28 },
			{ weight: 2, dest: 30 },
			{ weight: 3, dest: 41 },
		], // 29
		[
			{ weight: 2, dest: 29 },
			{ weight: 2, dest: 31 },
			{ weight: 3, dest: 42 },
		], // 30
		[
			{ weight: 2, dest: 30 },
			{ weight: 3, dest: 32 },
		], // 31
		[
			{ weight: 3, dest: 31 },
			{ weight: 3, dest: 33 },
			{ weight: 1, dest: 37 },
			{ weight: Math.sqrt(10), dest: 38 },
		], // 32
		[
			{ weight: 3, dest: 21 },
			{ weight: 3, dest: 32 },
			{ weight: Math.sqrt(10), dest: 37 },
			{ weight: 1, dest: 38 },
		], // 33
		[
			{ weight: 3, dest: 22 },
			{ weight: 2, dest: 33 },
			{ weight: 2, dest: 35 },
			{ weight: 3, dest: 42 },
		], // 34
		[
			{ weight: 3, dest: 23 },
			{ weight: Math.sqrt(13), dest: 24 },
			{ weight: 2, dest: 34 },
			{ weight: 2, dest: 36 },
			{ weight: 3, dest: 41 },
		], // 35
		[
			{ weight: Math.sqrt(13), dest: 23 },
			{ weight: 3, dest: 24 },
			{ weight: 2, dest: 26 },
			{ weight: 2, dest: 35 },
			{ weight: 3, dest: 40 },
		], // 36
		[
			{ weight: 1, dest: 32 },
			{ weight: Math.sqrt(10), dest: 33 },
			{ weight: 3, dest: 38 },
		], // 37
		[
			{ weight: Math.sqrt(10), dest: 32 },
			{ weight: 1, dest: 33 },
			{ weight: 3, dest: 37 },
		], // 38
		[
			{ weight: 3, dest: 26 },
			{ weight: 3, dest: 27 },
		], // 39
		[
			{ weight: 3, dest: 28 },
			{ weight: 3, dest: 36 },
		], // 40
		[
			{ weight: 3, dest: 29 },
			{ weight: 3, dest: 35 },
		], // 41
		[
			{ weight: 3, dest: 30 },
			{ weight: 3, dest: 34 },
		], // 42
		[
			{ weight: 1, dest: 4 },
			{ weight: Math.sqrt(10), dest: 5 },
			{ weight: 3, dest: 6 },
			{ weight: 2, dest: 7 },
		], // 43
		[
			{ weight: 4, dest: 10 },
		], // c
	],
	gfx: {
		size: { x: 16, y: 16 },
		boxes: [
			{ x: 0, y: 0, w: 4, h: 1 },
			{ x: 0, y: 1, w: 1, h: 3 },
			{ x: 11, y: 0, w: 5, h: 1 },
			{ x: 15, y: 1, w: 1, h: 4 },
			{ x: 0, y: 5, w: 1, h: 6 },
			{ x: 15, y: 7, w: 1, h: 4 },
			{ x: 2, y: 2, w: 5, h: 1 },
			{ x: 2, y: 4, w: 5, h: 1 },
			{ x: 2, y: 6, w: 5, h: 1 },
			{ x: 2, y: 8, w: 5, h: 1 },
			{ x: 2, y: 10, w: 5, h: 1 },
			{ x: 0, y: 12, w: 1, h: 4 },
			{ x: 2, y: 12, w: 1, h: 4 },
			{ x: 4, y: 12, w: 1, h: 4 },
			{ x: 6, y: 12, w: 1, h: 4 },
			{ x: 8, y: 12, w: 1, h: 4 },
			{ x: 11, y: 12, w: 1, h: 4 },
			{ x: 13, y: 12, w: 1, h: 4 },
			{ x: 15, y: 12, w: 1, h: 4 },
			{ x: 11, y: 8, w: 1, h: 3 },
			{ x: 13, y: 8, w: 1, h: 3 },
			{ x: 8, y: 0, w: 2, h: 1 },
			{ x: 8, y: 2, w: 2, h: 1 },
			{ x: 8, y: 4, w: 2, h: 1 },
			{ x: 8, y: 8, w: 2, h: 1 },
			{ x: 8, y: 10, w: 2, h: 1 },
			{ x: 11, y: 2, w: 1, h: 1 },
			{ x: 13, y: 2, w: 1, h: 1 },
			{ x: 11, y: 4, w: 3, h: 1 },
			{ x: 11, y: 6, w: 3, h: 1 },
		]
	}
}));

let shopping_list = new ShoppingList();

let add_item_btn = document.getElementById("add-item-btn");
let add_item_itx = document.getElementById("add-item-itx");
let start_route_btn = document.getElementById("start-route-btn");
add_item_itx.is_shown = false;

add_item_btn.addEventListener('click', function () {
	if (add_item_itx.is_shown) {
		if (!add_item_itx.value == "") {
			if (shopping_list.add_item(add_item_itx.value)) {
				add_item_itx.value = "";
				add_item_itx.is_shown = false;
				add_item_itx.style.display = "none";
			}
		}
		else {
			add_item_itx.is_shown = false;
			add_item_itx.style.display = "none";
		}
	}
	else {
		setTimeout(() => add_item_itx.focus(), 10);
		add_item_itx.is_shown = true;
		add_item_itx.style.display = "block";
	}
});

window.addEventListener('keydown', ({ key }) => {
	if (key != "Enter") return;

	if (add_item_itx.is_shown) {
		if (add_item_itx.value == "") {
			add_item_itx.style.display = "none";
			add_item_itx.is_shown = false;
		} else {
			if (shopping_list.add_item(add_item_itx.value)) {
				add_item_itx.value = "";
				add_item_itx.style.display = "none";
				add_item_itx.is_shown = false;
			}
		}
	} else {
		add_item_itx.is_shown = true;
		add_item_itx.style.display = "block";
		setTimeout(() => add_item_itx.focus(), 10);
	}
});

start_route_btn.addEventListener('click', () => {
	shopping_list.get_fastest_path_in_store(store);
});

let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");
function resize() {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	return resize;
}
window.addEventListener('resize', resize());
function render() {
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	store.render(ctx, canvas.width, canvas.height);

	window.requestAnimationFrame(render.bind(this, ...arguments));
}
render();

setTimeout(() => {
	let credits = document.querySelector("#credits");
	let names = ["Ella", "David", "Mathias", "Sofie"].shuffle();
	credits.textContent += `${names[0]}, ${names[1]}, ${names[2]} och ${names[3]}.`;
});

const lib = {
	all_permutations: function (list) {
		function inner(s, r, p) {
			if (r.length == 0) {
				p.push(s);
			} else {
				for (let [i, v] of Object.entries(r)) {
					let w = r.slice(0); // clone
					w.splice(i, 1);
					let sn = s.slice(0);
					sn.push(v);
					inner(sn, w, p);
				}
			}
		}
		let p = [];
		inner([], list, p);
		return p;
	}
};

Array.prototype.indexOfFn = function (predicate, fromIndex) {
	for (let i = fromIndex ? fromIndex : 0; i < this.length; i++)
		if (predicate(this[i]))
			return i;

	return -1;
}

Array.prototype.shuffle = function () {
	let key = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
	let S = this.map((_, i) => i);
	let j = 0;
	for (let i = 0; i < S.length; i++) {
		j = (j + S[i] + key[i % key.length]) % S.length;
		let swap = S[i];
		S[i] = S[j];
		S[j] = swap;
	}
	return this.map((_, i) => this[S[i]]);
}
