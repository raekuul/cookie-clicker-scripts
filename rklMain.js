loopsPerSecond = 20
// useful preset spells: 'hand of fate', "gambler's fever dream", 'conjure baked goods', 'resurrect abomination'
presetSpellString = "hand of fate"
didBankStuff = null
Grimoire = Game.Objects['Wizard tower'].minigame
try {
	preset_spell = Grimoire.spells[presetSpellString]
} catch {
	console.error("Grimoire not unlocked!")
	preset_spell = null
}
pantheon = Game.Objects['Temple'].minigame

function cleanupShimmerTextForLog(input){
	output = input.replace('<br>', '\n')
	output = output.replace('<div style="font-size:65%;">', '\n')
	output = output.replace(/(<([^>]+)>)/gi, "")
	return '\n'.concat(output,'\n')
}

function dynamicStackSize(building) {
	stack = 101
	do {
		stack = stack - 1
	} while ((Game.cookiesPs * 60 < building.getSumPrice(stack)) && (stack > 1))
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
	if ((Game.UpgradesOwned > 0) || (Game.Achievements['Hardcore'].won == 1)) {
		stack = getBuildingStackSize(building)
		upgrade = determineNextUpgrade()
		if (upgrade == -1) {
			out = Game.ObjectsById[building.id]
		} else if (upgrade.getPrice() < building.getSumPrice(stack)) {
			out = Game.UpgradesById[upgrade.id]
		} else {
			out = Game.ObjectsById[building.id]
		}
	} else {
		out = Game.ObjectsById[building.id]
	}
	reportNextPurchase(out)
	return out
}

nextItem = determineNextPurchase()

Game.Popup=function(inputText,x,y) {
	if (Game.popups) Game.textParticlesAdd(inputText,0,x,y);
	console.log(cleanupShimmerTextForLog(inputText))
	nextItem = determineNextPurchase()
}

function calculatePaybackPeriod(building) {
	stack = getBuildingStackSize(building)
	cost = building.getSumPrice(stack)
    if (building.count == 0) {
        cost = cost / 301
    } else if (building.count < 300) {
		cost = cost / (301 - building.count)
	}
	delta = Math.max(building.storedCps,1) * stack
	payback = (Math.max(cost - Game.cookies, 0)/Game.cookiesPsRaw) + cost/delta
	return payback
}

function upgradeIsEligible(upgrade) {
	// TODO:  exclude Chocolate Egg
	if (Game.vault.includes(upgrade.id)) {
		return false
	} else {
		if ((upgrade.pool == "") || (upgrade.pool == "cookie") || (upgrade.pool == "kitten")) {
			return true
		} else {
			return false
		}
	}
}

function calculateBankOffset() {
	cps = Math.max(Game.cookiesPsRaw,1)
		
	if ((Game.Upgrades["Lucky day"].bought == 0) || (Game.Upgrades["Serendipity"].bought == 0)) {
		return cps
	} else {
		if (Game.Upgrades["One mind"].bought == 0) {
			return cps * 6000
		}
		else {
			return cps * 42000
		}
	}
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
		return Game.PopRandomWrinkler()
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
	if (Game.ObjectsById[0].count < 20) {
		return Game.ObjectsById[0]
	} else {
		
		var selection = []
		var byPayback = []
		var subOneSec = []
		Game.ObjectsById.forEach(function(building){
			stack = getBuildingStackSize(building)
			byPayback.push({name: building.name, id: building.id, price: building.getSumPrice(stack), payback: Math.ceil(calculatePaybackPeriod(building))})
			if (building.getSumPrice(stack) < Game.cookiesPsRaw) {
				subOneSec.push({name: building.name, id: building.id, price: building.getSumPrice(stack), payback: Math.ceil(calculatePaybackPeriod(building))})
			}
		})
		byPayback.sort(function compareFn(a, b) {
			return a.payback - b.payback
		})
		selection.push(byPayback[0])
		
		if (subOneSec.length > 0) {
			subOneSec.sort(function compareFn(a, b) {
				return a.price - b.price
			})
			selection.push(subOneSec[0])
		}
			
		selection.sort(function compareFn(a, b) {
			return a.price - b.price
		})

		return Game.ObjectsById[selection[0].id]
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
	costInTime = convertSecondsToClock(Math.ceil(price / Game.cookiesPsRaw))
    costInDollars = valueInDollars(price)
	bankThreshold = price + bankOffset
	bankThresholdInDollars = valueInDollars(bankThreshold)
	timeToNext = convertSecondsToClock(Math.ceil((bankThreshold - Game.cookies)/Game.cookiesPs))
	console.log("\nNext: ".concat(item.name, " costs ", price.toExponential(3), " cookies (",costInDollars, ").\nBank carries ",Game.cookies.toExponential(3)," (",bankInDollars,") cookies.  Bank target ",bankThreshold.toExponential(3)," (",bankThresholdInDollars,") reached in ", timeToNext, ".\nCurrent Prestige Increase: ",prestigeDelta, ".\n"))
}

function bankedBuy(bankValue, item) {
	target = calculateBankOffset()
	if (item.getSumPrice == undefined) {
		price = item.getPrice()
	} else {
		stack = getBuildingStackSize(item)
		price = item.getSumPrice(stack)
	}
	
	if (price < (Game.cookiesPsRaw)) {
		try {
			item.buy(stack)
		} catch {
			item.click()
		}
		next = determineNextPurchase()
	} else if ((bankValue - price) >= target) {
		try {
			item.buy(stack)
		} catch {
			item.click()
		}
		next = determineNextPurchase()
	} else {
		next = item
	}
	return next
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
	if (Game.cookiesReset > 0) {
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
			market.buyGood(good.id,1)
			output = true
		}
	})
		
	return output
}

function clickGoldenSwitch() {
	/* 	
	Golden Switch stuff
		if (GoldenSwitch) {
			if ((Game.cookiesPsRaw >= Game.cookiesPs) && !((Click Frenzy) || (Cursed Finger)) {
				clickGoldenSwitch()
			}
		} else if !(Golden Switch) {
			if ((Click Frenzy) || (Cursed Finger)) {
				clickGoldenSwitch
			}
		}
			
	*/
}

function logic_loop()
{
	didBankStuff = false
	luckyValue = Game.cookies

	if ((preset_spell != null) && (canCastSpell() == true)) {
		Grimoire.castSpell(preset_spell)
	}

	//TODO:  Check if not Holobore
	Game.shimmers.forEach(function(shimmer) {
		//TODO:  delay until the last 1000 ms 
		shimmer.pop()
	})
	
	squishy = whenFullPopWrinkler()
	
	if (!(Game.TickerEffect == 0)) {
		Game.tickerL.click()
	}
	
	if (didBankStuff == true) {
		console.log("Purchased stocks this tick!  Not buying buildings/upgrades.")
	} else {
		if (Game.ObjectsById[0].count < 10) {
			thisItem = Game.ObjectsById[0]
		} else {
			thisItem = nextItem
		}
		nextItem = bankedBuy(luckyValue, thisItem)
	}
}

setInterval(function() {
	logic_loop()
}, 1000);

setInterval(function() {
	if (canClickBigCookie()) {
		Game.ClickCookie()
	} 
	if (!(Game.Objects['Bank'].amount == 0) && !(Game.Objects['Bank'].level == 0)) {
		didBankStuff = buyBargainStocks()
	}
}, (1000 / loopsPerSecond));
