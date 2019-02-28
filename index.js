class Item {
	constructor(name, barcode) {
		this.name = name;
		this.barcode = barcode;
	}
}

class Store {
	constructor() {
		this.verts = [
			{ items: [new Item("Absolut Vodka", "8850749311446")], },
			{ items: [], },
			{ items: [new Item("Mjölk", "7780721820430"), new Item("Fil", "640509040147")], },
			{ items: [], },
			// Att spara positionen av entrén och kassan
			// såhär är inte väldigt effektivt, men det
			// blir lättare att implementera affärer som
			// har flera kassor om jag börjar såhär
			{ entrance: true, },
			{ checkout: true, },
		];
		this.edges = [
			[
				{ weight: 3, dest: 1, },
			],
			[
				{ weight: 3, dest: 0, },
				{ weight: 2, dest: 2, },
				{ weight: 1, dest: 3, },
				{ weight: 2, dest: 4, },
			],
			[
				{ weight: 2, dest: 1, },
				{ weight: 2, dest: 3, },
			],
			[
				{ weight: 1, dest: 1, },
				{ weight: 2, dest: 2, },
				{ weight: 2, dest: 5, },
			],
			[
				{ weight: 2, dest: 1, },
			],
			[
				{ weight: 2, dest: 3, },
			]
		];
	}
	find_item(barcode) {
		for (let [i, v] of Object.entries(this.verts)) {
			for (let item of v.items) {
				if (item.barcode == barcode) {
					return i;
				}
			}
		}
		return -1;
	}
	path_between_items(barcode1, barcode2) {
		return this.path_between_vertices(
			this.find_item(barcode1),
			this.find_item(barcode2),
		);
	}
	path_from_entrance_to_item(barcode) {
		return this.path_between_vertices(
			lib.index_of_fn(this.verts, v => v.entrance),
			this.find_item(barcode),
		);
	}
	path_from_item_to_checkout(barcode) {
		return this.path_between_vertices(
			this.find_item(barcode),
			lib.index_of_fn(this.verts, v => v.checkout),
		)
	}
	path_between_vertices(src, dst) {
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

		console.error("rip in peperonis, this is awful");
	}
}

class ShoppingList {
	constructor() {
		this.items = [
			"7780721820430",
			"8850749311446",
			"640509040147",
		];
		this.path = null;
	}
	reorder_to_fastest_path_in_store(store) {
		let perms = lib.all_permutations(this.items);

		let shortest_perm = { value: [], length: Infinity };
		for (let perm of perms) {
			let paths = [store.path_from_entrance_to_item(perm[0])];
			for (let i = 0; i < perm.length - 1; i++) {
				paths.push(store.path_between_items(perm[i], perm[i + 1]));
			}
			paths.push(store.path_from_item_to_checkout(perm[perm.length - 1]));

			let length = paths.reduce((acc, { length }) => acc + length);
			if (length < shortest_perm.length) {
				shortest_perm.length = length;
				shortest_perm.value = paths;
			}
		}

		this.path = shortest_perm;
	}
}

let store = new Store();
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
