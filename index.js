const name_of_item = {
	"8850749311446": "Absolut Vodka",
	"7780721820430": "Mjölk",
	"6405090401472": "Fil",
	"7340116870009": "Aloe Vera Original",
	"1234567890123": "Exempelvara 1",
	"1234554390123": "Exempelvara 2",
	"1234567890113": "Exempelvara 3",
	"1234574230123": "Exempelvara 4",
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
		throw `Item ${p} not found.`;
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
			lib.index_of_fn(this.verts, v => v.entrance),
			this.find_item(item),
		);
	}
	path_from_item_to_checkout(item) {
		return this.path_between_vertices(
			this.find_item(item),
			lib.index_of_fn(this.verts, v => v.checkout),
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

		throw "rip in peperonis, this is awful";
	}
}

class ShoppingList {
	constructor() {
		this.items = [];
		this.path = null;
		this.ul = document.querySelector("#shoplist");
	}
	get_fastest_path_in_store(store) {
		if (this.items.length == 0)
			throw "Yer already done m8, shopping list empty";

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
	add(item) {
		if (!item instanceof Item)
			throw "You can only add items to your shopping list, m8";

		this.items.push(item);
		this.update();
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

let store = new Store(`{
	"verts": [
		{ "items": ["8850749311446"] },
		{},
		{ "items": ["7780721820430", "6405090401472"] },
		{},
		{ "entrance": true },
		{ "checkout": true }
	],
	"edges": [
		[
			{ "weight": 3, "dest": 1 }
		],
		[
			{ "weight": 3, "dest": 0 },
			{ "weight": 2, "dest": 2 },
			{ "weight": 1, "dest": 3 },
			{ "weight": 2, "dest": 4 }
		],
		[
			{ "weight": 2, "dest": 1 },
			{ "weight": 2, "dest": 3 }
		],
		[
			{ "weight": 1, "dest": 1 },
			{ "weight": 2, "dest": 2 },
			{ "weight": 2, "dest": 5 }
		],
		[
			{ "weight": 2, "dest": 1 }
		],
		[
			{ "weight": 2, "dest": 3 }
		]
	]
}`);

let shopping_list = new ShoppingList();

const lib = {
	index_of_fn: function(list, predicate) {
		for (let [index, value] of Object.entries(list)) {
			if (predicate(value)) {
				return index;
			}
		}
		return -1;
	},
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
