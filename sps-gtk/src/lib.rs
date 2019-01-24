use std::{collections::HashMap, u32};

#[derive(Clone, Debug, Copy)]
pub struct Position {
	pub col: u32,
	pub row: u32,
}

pub type ItemId = u32; // perhaps a string, this can be the barcode

#[derive(Clone, Debug)]
pub struct Item {
	name: String,
	id: ItemId,
}

impl Item {
	pub fn new(name: &str, id: ItemId) -> Self {
		Self {
			name: name.into(),
			id,
		}
	}
	pub fn id(&self) -> ItemId {
		self.id
	}
}

pub struct Store {
	item_map: HashMap<ItemId, Position>,
	entrance: Position,
	checkout: Position,
}

impl Store {
	pub fn new(
		item_map: HashMap<ItemId, Position>,
		entrance: Position,
		checkout: Position,
	) -> Self {
		Self {
			item_map,
			entrance,
			checkout,
		}
	}
	fn get_pos_of_item(&self, id: ItemId) -> Option<Position> {
		if let Some(position) = self.item_map.get(&id) {
			Some(*position)
		} else {
			None
		}
	}
	fn dist_between_items(&self, a: ItemId, b: ItemId) -> u32 {
		let pos1 = self
			.get_pos_of_item(a)
			.expect("This store misses some item in your shopping list");
		let pos2 = self
			.get_pos_of_item(b)
			.expect("This store misses some item in your shopping list");

		((pos1.col as i64 - pos2.col as i64).abs() + (pos1.row as i64 - pos2.row as i64).abs())
			as u32
	}
	fn dist_from_entrance(&self, id: ItemId) -> u32 {
		let pos = self
			.get_pos_of_item(id)
			.expect("This store misses some item in your shopping list");

		((self.entrance.col as i64 - pos.col as i64).abs()
			+ (self.entrance.row as i64 - pos.row as i64).abs()) as u32
	}
	fn dist_to_checkout(&self, id: ItemId) -> u32 {
		let pos = self
			.get_pos_of_item(id)
			.expect("This store misses some item in your shopping list");

		((self.checkout.col as i64 - pos.col as i64).abs()
			+ (self.checkout.row as i64 - pos.row as i64).abs()) as u32
	}
}

#[derive(Debug)]
pub struct Shoplist {
	items: Vec<Item>,
	walking_length: Option<u32>,
}

impl Shoplist {
	pub fn new(items: Vec<Item>) -> Self {
		Self {
			items,
			walking_length: None,
		}
	}
	pub fn reorder_path(&mut self, store: Store) {
		let mut perms = Vec::new();

		permutations(vec![], self.items.clone(), &mut perms);

		let mut shortest_perm = (vec![], u32::MAX);
		for perm in perms {
			let length: u32 = store.dist_from_entrance(perm[0].id())
				+ perm
					.iter()
					.zip(perm.iter().skip(1))
					.map(|(item1, item2)| store.dist_between_items(item1.id(), item2.id()))
					.sum::<u32>()
				+ store.dist_to_checkout(perm[perm.len() - 1].id());
			if length < shortest_perm.1 {
				shortest_perm = (perm, length);
			}
		}
		self.items = shortest_perm.0;
		self.walking_length = Some(shortest_perm.1);
	}
}

fn permutations(select: Vec<Item>, remaining: Vec<Item>, perms: &mut Vec<Vec<Item>>) {
	if remaining.len() == 0 {
		perms.push(select);
	} else {
		for (i, r) in remaining.iter().enumerate() {
			let mut wk = remaining.clone();
			wk.remove(i);
			let mut s = select.clone();
			s.push(r.clone());
			permutations(s, wk, perms);
		}
	}
}
