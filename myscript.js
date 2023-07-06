function calculatePaybackPeriod(building) {
	cost = building.price
	delta = Math.max(building.storedCps,0.1)
	bank = Game.cookies
	cps = Math.max(Game.cookiesPsRaw,0.1)
	payback = Math.max((cost-bank),0)/cps + cost/delta
	return payback
}

function determineNextPurchase() {
	var byPayback = []
	Game.ObjectsById.forEach(function(building){
		byPayback.push({name: building.name, id: building.id, price: building.price, payback: calculatePaybackPeriod(building)})
	})
	byPayback.sort(function compareFn(a, b) {
		return a.payback - b.payback
	})
	console.log(byPayback[0])
	return byPayback[0].id
}

nextBuilding = determineNextPurchase()

function unbankedBuyBuilding(building) {
	if (Game.cookies > building.price) {
		building.buy()
		return determineNextPurchase()
	} else {
		return building.id
	}
}

function bankedBuyBuilding(bankValue, target, building) {
	if((bankValue - building.price) > target) {
		building.buy()
		return determineNextPurchase()
	} else {
		return building.id
	}
}

function logic_loop()
{
	luckyValue = Game.cookies * 0.15
	luckyBankTarget = Game.cookiesPsRawHighest * 60 * 15
	frenzyBankTarget = luckyBankTarget * 7
	
	thisBuilding = Game.ObjectsById[nextBuilding]

	Game.shimmers.forEach(function(shimmer) {
		shimmer.pop()
	})
	
	// click if won Neverclick and veil is inactive
	/*
	 *
	 *
	 */

	// temporary workaround: click unless clicked 15 times this session
	if !(Game.clicksThisSession == 15) {
		Game.ClickCookie()
	} 
	
	if ((Game.Upgrades["Lucky day"].bought == 0) && (Game.Upgrades["Serendipity"].bought == 0)) {
		if (Game.hasBuff('Frenzy') == 0) {
			nextBuilding = unbankedBuyBuilding(thisBuilding)
		}
	} else {
		if (Game.Upgrades["One mind"].bought == 0) {
			nextBuilding = bankedBuyBuilding(luckyValue, luckyBankTarget, thisBuilding)
		}
		else {
			nextBuilding = bankedBuyBuilding(luckyValue, frenzyBankTarget, thisBuilding)
		}
	}
}

setInterval(function() {
	logic_loop()
}, 100);
