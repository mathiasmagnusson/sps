mod lib;

use self::lib::*;
use std::collections::HashMap;

fn main() {
	let mut shoplist = Shoplist::new(
		vec![
			Item::new("Vodka", 0),
			Item::new("Kvass", 1),
			Item::new("Sputnik", 2),
			Item::new("Blini", 3),
			Item::new("AK-47", 4),
		]
	);
	let mut item_map: HashMap<ItemId, Position> = Default::default();
	item_map.insert(0, Position { col: 6, row: 1 });
	item_map.insert(1, Position { col: 0, row: 2 });
	item_map.insert(2, Position { col: 3, row: 5 });
	item_map.insert(3, Position { col: 2, row: 2 });
	item_map.insert(4, Position { col: 3, row: 0 });
	let store = Store::new(item_map, Position { col: 4, row: 0 }, Position { col: 0, row: 0 });
	shoplist.reorder_path(store);
	println!("{:?}", shoplist);
}
