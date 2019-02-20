class Item {
	constructor(name, id) {
		this.name = name;
		this.id = id;
	}
}

class Store {
	constructor() {
		this.verts = [
			{
				items: [new Item("Absolut Vodka", "8850749311446")],
			},
			{
				items: [],
			},
			{
				items: [new Item("Mjölk", "7780721820430"), new Item("Fil", "640509040147")],
			},
			{
				items: [],
			}
		];
		this.edges = [
			[
				{
					weight: 3,
					dest: 1,
				},
			],
			[
				{
					weight: 3,
					dest: 0,
				},
				{
					weight: 4,
					dest: 2,
				},
				{
					weight: 5,
					dest: 3,
				},
			],
			[
				{
					weight: 4,
					dest: 1
				},
				{
					weight: 2,
					dest: 3,
				}
			],
			[
				{
					weight: 5,
					dest: 1,
				},
				{
					weight: 2,
					dest: 2,
				}
			]
		];
	}
	path_between_items(id1, id2)
}

let shoplist = [];