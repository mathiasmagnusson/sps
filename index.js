const name_of_item = {
	"8850749311446": "Munkar",
	"7780721820430": "Mjölk",
	"6405090401472": "Fil",
	"7340116870009": "Diverse Konserver",
	"7310865003201": "Vispgrädde",
	"1234567890123": "Julmust",
	"7698435798435": "Midsommarmust",
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
				if (p == name) {
					this.name = name;
					this.barcode = barcode;
					return;
				}
			}
		}
		throw `Item "${p}" not found.`;
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
	render(ctx, w, h) {
		ctx.fillStyle = "black";
		for (let box of this.gfx.boxes) {
			ctx.fillRect(box.x * w, box.y * h, box.w * w, box.h * h);
		}
	}
}

class ShoppingList {
	constructor() {
		this.items = [];
		this.path = null;
		this.ul = document.querySelector("#shoplist");
	}
	get_fastest_path_in_store(store) {
		if (!store instanceof Store) throw "Thats not a store, m8";

		if (this.items.length == 0)
			throw "Yer already done m8, shopping list empty";
		
		for (let item of this.items)
			if (store.find_item(item) == -1)
				throw `${item.name} does not exist in this store`;

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
		catch(e) {
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
		{ entrance: true },
		{ items: [] },
		{ items: ["8850749311446"] },
		{ items: [] },
		
		{ checkout: true },
	],
	edges: [
		[
			{ weight: 1, dest: 1 }
		]
	],
	gfx: {
		boxes: [
			{ x: 0,      y: 0,      w: 0.25,   h: 0.0625 },
			{ x: 0,      y: 0,      w: 0.0625, h: 0.25   },
			{ x: 0.5,    y: 0,      w: 0.15,   h: 0.0625 },
			{ x: 0.5,    y: 0.125,  w: 0.15,   h: 0.0625 },
			{ x: 0.5,    y: 0.25,   w: 0.15,   h: 0.0625 },
			{ x: 0.5,    y: 0.5,    w: 0.15,   h: 0.0625 },
			{ x: 0.5,    y: 0.625,  w: 0.15,   h: 0.0625 },
			{ x: 0.7,    y: 0,      w: 0.3,    h: 0.0625 },
			{ x: 0.125,  y: 0.125,  w: 0.3,    h: 0.0625 },
			{ x: 0.125,  y: 0.25,   w: 0.3,    h: 0.0625 },
			{ x: 0.125,  y: 0.375,  w: 0.3,    h: 0.0625 },
			{ x: 0.125,  y: 0.5,    w: 0.3,    h: 0.0625 },
			{ x: 0.125,  y: 0.625,  w: 0.3,    h: 0.0625 },
			{ x: 0.7,    y: 0.125,  w: 0.0625, h: 0.0625 },
			{ x: 0.825,  y: 0.125,  w: 0.0625, h: 0.0625 },
			{ x: 0.7,    y: 0.25,   w: 0.1875, h: 0.0625 },
			{ x: 0.7,    y: 0.375,  w: 0.1875, h: 0.0625 },
			{ x: 0.9375, y: 0,      w: 0.0625, h: 0.3125 },
			{ x: 0,      y: 0.3125, w: 0.0625, h: 0.375  },
			{ x: 0,      y: 0.75,   w: 0.0625, h: 0.25   },
			{ x: 0.125,  y: 0.75,   w: 0.0625, h: 0.25   },
			{ x: 0.25,   y: 0.75,   w: 0.0625, h: 0.25   },
			{ x: 0.375,  y: 0.75,   w: 0.0625, h: 0.25   },
			{ x: 0.5,    y: 0.75,   w: 0.0625, h: 0.25   },
			{ x: 0.9375, y: 0.75,   w: 0.0625, h: 0.25   },
			{ x: 0.9375, y: 0.4375, w: 0.0625, h: 0.25   },
			{ x: 0.7,    y: 0.75,   w: 0.0625, h: 0.25   },
			{ x: 0.825,  y: 0.75,   w: 0.0625, h: 0.25   },
			{ x: 0.7,    y: 0.5,    w: 0.0625, h: 0.1875 },
			{ x: 0.825,  y: 0.5,    w: 0.0625, h: 0.1875 },
		]
	}
}));

let shopping_list = new ShoppingList();

let add_item_btn = document.getElementById("add-item-btn");
let add_item_itx = document.getElementById("add-item-itx");
let start_route_btn = document.getElementById("start-route-btn");
add_item_itx.is_shown = false;

add_item_btn.addEventListener('click', function() {
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
		if (!add_item_itx.value == "") {
			shopping_list.add_item(add_item_itx.value);
			add_item_itx.value = "";
		}
		add_item_itx.style.display = "none";
		add_item_itx.is_shown = false;
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

const lib = {
	all_permutations: function(list) {
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

Array.prototype.indexOfFn = function(predicate, fromIndex) {
	for (let i = fromIndex ? fromIndex : 0; i < this.length; i++)
		if (predicate(this[i]))
			return i;

	return -1;
}
