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
			{ items: [], }
		];
		this.edges = [
			[
				{ weight: 3, dest: 1, },
			],
			[
				{ weight: 3, dest: 0, },
				{ weight: 7, dest: 2, },
				{ weight: 1, dest: 3, },
			],
			[
				{ weight: 7, dest: 1 },
				{ weight: 2, dest: 3, }
			],
			[
				{ weight: 1, dest: 1, },
				{ weight: 2, dest: 2, }
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
		let src = this.find_item(barcode1);
		let dst = this.find_item(barcode2);

		let dist = this.verts.map(() => Infinity);
		let prev = this.verts.map(() => -1);
		let nx = this.verts.map((_, i) => i);

		dist[src] = 0;

		while (nx.length > 0) {
			let u = dist.indexOf(Math.min(...nx.map(v => dist[v])));

			nx.splice(nx.indexOf(u), 1);

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
