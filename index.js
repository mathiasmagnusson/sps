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

let shoplist = [];

let store = new Store();

const lib = {
	index_of_fn: function(list, predicate) {
		for (let [index, value] of Object.entries(list)) {
			if (predicate(value)) {
				return index;
			}
		}
		return -1;
	}
};
