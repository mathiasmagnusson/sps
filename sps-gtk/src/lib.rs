#[derive(Clone, Debug)]
pub struct Position {
	row: u32,
	col: u32,
}

#[derive(Clone, Debug)]
pub struct Item {
	name: String,
	barcode: String, // perhaps just a number or something
	pos: Position,
}

pub struct Shoplist {
	items: Vec<Item>,
}

impl Shoplist {
	pub fn reorder_path(&mut self, _entrance: Position, _checkout: Position) {
		let mut perms = Vec::new();

		permutations(vec![], self.items.clone(), &mut perms);

		for _perm in perms {
			// get length of perm
			// remember to start at entrance, not the first item in perm and end at checkout
			// save which perm is shortest
		}
		// set reorder self.items to the order in perms
	}
}

pub fn permutations(select: Vec<Item>, remaining: Vec<Item>, perms: &mut Vec<Vec<Item>>) {
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
