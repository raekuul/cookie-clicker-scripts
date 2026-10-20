loopsPerSecond = 20
// useful preset spells: 'hand of fate', "gambler's fever dream", 'conjure baked goods', 'resurrect abomination'
presetSpellString = "hand of fate"
didBankStuff = null
Grimoire = Game.Objects['Wizard tower'].minigame
try {
	preset_spell = Grimoire.spells[presetSpellString]
} catch {
	console.log("[COOKIE] Grimoire not unlocked!")
	preset_spell = null
}
pantheon = Game.Objects['Temple'].minigame

function cleanupShimmerTextForLog(input){
	output = input.replace('<br>', '[br]')
	output = output.replace('<div style="font-size:65%;">', '[br]')
	output = output.replace(/(<([^>]+)>)/gi, "")
	return "[COOKIE][br]".concat(output,'[br]')
}

function dynamicStackSize(building) {
	stack = 251
	do {
		stack = stack - 1
	} while ((Game.cookiesPsRaw < building.getSumPrice(stack)) && (stack > 1))
	if (stack > 1) {	
		return stack
	} else {
		return 1
	}
}

function getBuildingStackSize(building) {
	if (isRigidelSlotted()) {
		return (10 - (building.amount % 10))
	} else {
		return dynamicStackSize(building)
	}
}

function determineNextPurchase() {
	out = Game.ObjectsById[0]
	building = determineNextBuilding()
	if ((Game.Achievements['Hardcore'].won == 1)) {
		stack = getBuildingStackSize(building)
		upgrade = determineNextUpgrade()
		if (upgrade == -1) {
			out = Game.ObjectsById[building.id]
		} else if (upgrade.getPrice() < building.price) {
			out = Game.UpgradesById[upgrade.id]
		} else {
			out = Game.ObjectsById[building.id]
		}
	} else {
		out = Game.ObjectsById[building.id]
	}
	return out
}

Game.Popup=function(inputText,x,y) {
	if (Game.popups) Game.textParticlesAdd(inputText,0,x,y);
	console.log(cleanupShimmerTextForLog(inputText))
}

function calculatePaybackPeriod(building) {
	stack = getBuildingStackSize(building)
	cost = building.getSumPrice(stack)
	delta = Math.max(building.storedCps,1) * stack
	payback = (Math.max(cost - Game.cookies, 0)/Game.cookiesPsRaw) + cost/delta
	return payback
}

function upgradeIsEligible(upgrade) {
	// Excludes all vaulted upgrades, plus Heavenly Chip Secret and Chocolate Egg
	if (Game.vault.includes(upgrade.id) || (upgrade.id == 129) || (upgrade.id == 227)) {
		return false
	} else {
		if ((upgrade.pool == "") || (upgrade.pool == "cookie") || (upgrade.pool == "kitten") || (upgrade.pool == "tech"))  {
			return true
		} else {
			return false
		}
	}
}

function calculateBankOffset() {
	n = Game.UpgradesById[52].bought + Game.UpgradesById[53].bought + Game.UpgradesById[86].bought + Game.UpgradesById[64].bought + Game.UpgradesById[65].bought + Game.UpgradesById[66].bought + Game.UpgradesById[67].bought + Game.UpgradesById[68].bought + Game.UpgradesById[69].bought + Game.UpgradesById[70].bought + Game.UpgradesById[71].bought + Game.UpgradesById[72].bought + Game.UpgradesById[73].bought
	d = 13
	fm = (1000 * 6 * 7)
	oexp = 1 + fm**(n/d)
	return (Math.max(Game.cookiesPsRaw,1) * oexp)
}

function whenFullPopWrinkler() {
	var wrinklerValues = []
	Game.wrinklers.forEach(function(wrinkler) {
		if (wrinkler.phase == 2) {
			if (!(wrinkler.type == 0)) {
				wrinklerValues.push({id: wrinkler.id, value: wrinkler.sucked / 100, type: wrinkler.type})
			} else {
				wrinklerValues.push({id: wrinkler.id, value: wrinkler.sucked, type: wrinkler.type})
			}	
		}
	})
	if (wrinklerValues.length == Game.getWrinklersMax()) {
		wrinklerValues.sort(function compareFn(a, b) {
			return b.value - a.value
		})
		Game.wrinklers[wrinklerValues[0].id].hp = 0
		return wrinklerValues[0]
	} else {
		return -1
	}
}

function convertSecondsToClock(seconds) {
	if (seconds == NaN) {
		output = "not calculable"
		return output
	} else if (seconds < 1) {
		output = "now!"
		return output 
	} else {
		seconds = Math.max(seconds, 0)
		
		sec = (seconds % 60).toString().padStart(2,"0")
		min = Math.max(Math.floor(seconds/60) % 60,0).toString().padStart(2,"0")
		hou = Math.max(Math.floor(seconds/3600) % 24,0).toString().padStart(2,"0")
		day = Math.max(Math.floor(seconds/(60*60*24)),0).toString().padStart(3,"0")

		output = ""

		if (day > 365) {
			output = "more than one year"
		} else {
			output = output.concat(day,":",hou,":",min,":",sec)
		}
		return output
	}
}

function determineNextUpgrade() {
	var availableUpgrades = []
	Game.UpgradesInStore.forEach(function(upgrade){
		if (upgradeIsEligible(upgrade)) {
			availableUpgrades.push({name: upgrade.name, id: upgrade.id, price: upgrade.getPrice()})
		}
	})

	if (availableUpgrades.length > 0) {
		availableUpgrades.sort(function compareFn(a, b) {
			return a.price - b.price
		})
		return Game.UpgradesById[availableUpgrades[0].id]
	} else {
		return -1
	}
}

function determineNextBuilding() {
	var byPayback = []
	var subOneSec = []
	Game.ObjectsById.forEach(function(building){
		byPayback.push({name: building.name, id: building.id, price: building.price, payback: Math.ceil(calculatePaybackPeriod(building))})
		if (building.price < Game.cookiesPsRaw) {
			subOneSec.push({name: building.name, id: building.id, price: building.price, count: building.amount})
		}
	})
	if (subOneSec.length > 0) {
		subOneSec.sort(function compareFn(a, b) {
			return a.price - b.price
		})
		return Game.ObjectsById[subOneSec[0].id]
	} else {
		byPayback.sort(function compareFn(a, b) {
			return a.payback - b.payback
		})
		return Game.ObjectsById[byPayback[0].id]
	}
}


function valueInDollars(value) {
	return "$".concat((value / Game.cookiesPsRawHighest).toFixed(2))
}

function reportNextPurchase(item) {
	bankInDollars = valueInDollars(Game.cookies)
	if (item.getSumPrice == undefined) {
		price = item.getPrice()
	} else {
		stack = getBuildingStackSize(item)
		price = item.getSumPrice(stack)
	}
	prestigeDelta = calculatePrestigeDelta()
	bankOffset = calculateBankOffset()
	offsetInDollars = valueInDollars(bankOffset)
    costInDollars = valueInDollars(price)
	bankThreshold = price + bankOffset
	bankThresholdInDollars = valueInDollars(bankThreshold)
	deficit = bankThreshold - Game.cookies
	deficitInDollars = valueInDollars(deficit)
	timeToNext = convertSecondsToClock(Math.ceil((bankThreshold - Game.cookies)/Game.cookiesPs))
    bonusMul = (Game.cookiesPs / Game.cookiesPsRawHighest).toFixed(2)
	console.log("[COOKIE][br]Next: ".concat(item.name, " costs ", price.toExponential(3), " cookies[br](",costInDollars, " + ",offsetInDollars,") - ",bankInDollars," = ",deficitInDollars,"[br]Bank target reached in ", timeToNext, ".[br]Current Prestige Increase: ",prestigeDelta, ".[br]Current Production Multiplier: ",bonusMul, ".[br]"))
}

function bankedBuy(bankValue, item) {
	target = calculateBankOffset()
	if (item.getSumPrice == undefined) {
		price = item.getPrice()
	} else {
		stack = getBuildingStackSize(item)
		price = item.getSumPrice(stack)
	}
	if (price < Game.cookiesPsRawHighest) {
		try {
			item.buy(stack)
		} catch {
			item.click()
		}
		return determineNextPurchase()
	} else if (bankValue >= (price + target)) {
		try {
			item.buy(stack)
		} catch {
			item.click()
		}
		return determineNextPurchase()
	} else {
		return item
	}
}

function canCastSpell() {
	if ((Game.Objects['Wizard tower'].amount < 25) || (Game.Objects['Wizard tower'].level == 0)) {
		return false
	} else {
		return (Grimoire.magic == Grimoire.magicM)
	}
}

function isRigidelSlotted() {
	if ((Game.Objects['Temple'].amount == 0) || (Game.Objects['Temple'].level == 0)) {
		return false
	} else {
		return (pantheon.slot.includes(10))
	}
}

function calculatePrestigeDelta() {
	if (Game.heavenlyChips > 0) {
		mode = "magnitude"
		current = (1/Game.HCfactor) * (Math.log10(Game.cookiesReset) - 12)
		next = (1/Game.HCfactor) * (Math.log10(Game.cookiesReset + Game.cookiesEarned) - 12)	
		delta = next - current
		if (delta < 3) {
			delta = Math.pow(10,delta)
			mode = "multiplier"
		}
		return "".concat((delta).toFixed(3)," (",mode,")")
	} else {
		first = (1/Game.HCfactor) * (Math.log10(Game.cookiesEarned) - 12)
		return "".concat(Math.pow(10,first).toFixed(3), " (chips)")
	}
}

function canClickBigCookie() {
	if (Game.Achievements['Neverclick'].won == 1) {
		if (Game.UpgradesByPool['prestige'][78].bought == 0) { 
				return true
			} else {
			if (Game.UpgradesByPool['toggle'][14].bought == 0) {
				return true
			} else { 
				return false
			}
		}
	} else {
		return false
	}
}

function buyBargainStocks() {
	output = false
	market = Game.Objects['Bank'].minigame
	
	market.goodsById.forEach(function(good){
		maxStock = market.getGoodMaxStock(good)
		if ((good.val == 1) && (maxStock > good.stock) && (Game.cookies > (calculateBankOffset()))) {
			market.buyGood(good.id,100)
			output = true
		}
	})
		
	return output
}

function areClickBuffsActive() {
	if (Game.hasBuff(5) || Game.hasBuff(6) || Game.hasBuff(7)) {
		return true
	} else {
		return false
	}
}

function clickGoldenSwitch() {
	if (Game.UpgradesInStore.includes(331)) { // Golden Switch inactive
			if (areClickBuffsActive() && (Game.cookies > (Game.cookiesPs * 60 * 60))) {
				Game.UpgradesById[331].buy()
				return 1
			} else {
				return -1
			}
		} else if (Game.UpgradesInStore.includes(332)) { // Golden Switch active
			if (!(areClickBuffsActive()) && (Game.cookiesPs < Game.cookiesPsRaw) && (Game.cookies > (Game.cookiesPs * 60 * 60))) {
				Game.UpgradesById[332].buy()
				return 0
			} else {
				return -1
			}
	} else { // Golden Switch does not exist
		return -1
	}
}

function injected_loop()
{
	if ((preset_spell != null) && (canCastSpell() == true)) {
		Grimoire.castSpell(preset_spell)
	}
	
	if (!(Game.TickerEffect == 0)) {
		Game.tickerL.click()
	}
	if (Game.ObjectsById[5].level > 0) {
		buyBargainStocks()
	}
	
	if (Game.ObjectsById[0].count < 20) {
		thisItem = Game.ObjectsById[0]
	} else {
		thisItem = nextItem
	}	
    nextItem = bankedBuy(Game.cookies, thisItem)
	reportNextPurchase(nextItem)
}

nextItem = determineNextPurchase()

setInterval(function() {
	whenFullPopWrinkler()
	//TODO:  Check if not Holobore
	Game.shimmers.forEach(function(shimmer) {
		//TODO:  delay until the last 1000 ms 
		shimmer.pop()
	})
    clickGoldenSwitch()
	if (canClickBigCookie()) {
		Game.ClickCookie()
	} 
}, (1000 / loopsPerSecond));

setInterval(function() {
	injected_loop()
}, 1000);
