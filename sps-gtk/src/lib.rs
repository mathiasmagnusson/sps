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
}

#[derive(Debug)]
pub struct Shoplist {
	items: Vec<Item>,
	walking_length: Option<u32>,
}

impl Shoplist {
	pub fn new(items: Vec<Item>) -> Self {
		Self { items, walking_length: None }
	}
	pub fn reorder_path(&mut self, store: Store) {
		let mut perms = Vec::new();

		permutations(vec![], self.items.clone(), &mut perms);

		let mut shortest_perm = (vec![], u32::MAX);
		for perm in perms {
			let length: u32 = {
				let item = store
					.get_pos_of_item(perm[0].id())
					.expect("This store misses some item in your shopping list");

				((store.entrance.col as i64 - item.col as i64).abs()
					+ (store.entrance.row as i64 - item.row as i64).abs()) as u32
			} + perm
				.iter()
				.zip(perm.iter().skip(1))
				.map(|(item1, item2)| {
					let pos1 = store
						.get_pos_of_item(item1.id())
						.expect("This store misses some item in your shopping list");
					let pos2 = store
						.get_pos_of_item(item2.id())
						.expect("This store misses some item in your shopping list");

					((pos1.col as i64 - pos2.col as i64).abs()
						+ (pos1.row as i64 - pos2.row as i64).abs()) as u32
				})
				.sum::<u32>()
				+ {
					let item = store
						.get_pos_of_item(perm[perm.len() - 1].id())
						.expect("This store misses some item in your shopping list");

					((store.checkout.col as i64 - item.col as i64).abs()
						+ (store.checkout.row as i64 - item.row as i64).abs()) as u32
				};
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
