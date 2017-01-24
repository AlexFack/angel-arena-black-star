"use strict";
var ONCLICK_PURGABLE_MODIFIERS = [
	"modifier_rubick_personality_steal",
	"modifier_tether_ally_aghanims"
];
var DOTA_ACTIVE_GAMEMODE = -1,
	DOTA_ACTIVE_GAMEMODE_TYPE = -1,
	CustomChatLinesPanel,
	BossDropVoteTimers = [];

function UpdatePanoramaHUD() {
	var unit = Players.GetLocalPlayerPortraitUnit()
	FindDotaHudElement("UnitNameLabel").text = $.Localize(GetHeroName(unit)).toUpperCase();
	var inventory_items = FindDotaHudElement("inventory_items")
	for (var i = 0; i <= 8; i++) {
		var item = Entities.GetItemInSlot(unit, i)
		var custom_entity_value = GameUI.CustomUIConfig().custom_entity_values[item];
		if (item > -1 && custom_entity_value != null && custom_entity_value.ability_texture != null) {
			var itemPanel = inventory_items.FindChildTraverse("inventory_slot_" + i)
			if (itemPanel != null)
				itemPanel.FindChildTraverse("ItemImage").SetImage(TransformTextureToPath(custom_entity_value.ability_texture, "item"));
		}
	}

	var CustomModifiersList = $("#CustomModifiersList")
	var VisibleModifiers = [];
	for (var i = 0; i < Entities.GetNumBuffs(unit); ++i) {
		var buffSerial = Entities.GetBuff(unit, i);
		if (buffSerial != -1) {
			var buffName = Buffs.GetName(unit, buffSerial)
			VisibleModifiers.push(buffName);
			if (ONCLICK_PURGABLE_MODIFIERS.indexOf(buffName) != -1) {
				if (CustomModifiersList.FindChildTraverse(buffName) == null) {
					var panel = $.CreatePanel("DOTAAbilityImage", CustomModifiersList, buffName)
					panel.abilityname = Buffs.GetTexture(unit, buffSerial);
					panel.SetPanelEvent("onactivate", (function(_buffName) {
						return function() {
							GameEvents.SendCustomGameEventToServer("modifier_clicked_purge", {
								unit: unit,
								modifier: _buffName
							});
						};
					})(buffName));
					panel.SetPanelEvent("onmouseover", (function(_panel, _buffName) {
						return function() {
							$.DispatchEvent("DOTAShowTitleTextTooltip", _panel, $.Localize("DOTA_Tooltip_" + _buffName), $.Localize("hud_modifier_click_to_remove"));
						};
					})(panel, buffName))
					panel.SetPanelEvent("onmouseout", (function(_panel) {
						return function() {
							$.DispatchEvent("DOTAHideTitleTextTooltip", _panel);
						};
					})(panel))
				}
			}
		}
	}

	$.Each(CustomModifiersList.Children(), function(child) {
		if (VisibleModifiers.indexOf(child.id) == -1)
			child.DeleteAsync(0);
	})

	FindDotaHudElement("level_stats_frame").visible = Entities.GetAbilityPoints(unit) > 0 && Entities.IsControllableByPlayer(unit, Game.GetLocalPlayerID());

	var GoldLabel = FindDotaHudElement("ShopButton").FindChildTraverse("GoldLabel")
	GoldLabel.text = "";
	if (Players.GetTeam(Game.GetLocalPlayerID()) == Entities.GetTeamNumber(unit)) {
		var goldTable = PlayerTables.GetTableValue("arena", "gold")
		var playerowner = Entities.GetHeroPlayerOwner(unit)
		if (goldTable && goldTable[playerowner] != null) {
			GoldLabel.text = goldTable[playerowner]
		}
	}
	/*var apw = FindDotaHudElement("AbilitiesAndStatBranch").GetParent().actuallayoutwidth;
	if (!isNaN(apw) && apw > 0)
		FindDotaHudElement("HUDSkinAbilityContainerBG").style.width = ((FindDotaHudElement("AbilitiesAndStatBranch").actuallayoutwidth + 16) / apw * 100) + "%";*/
	var sw = Game.GetScreenWidth()
	var sh = Game.GetScreenHeight()
	var minimap = FindDotaHudElement("minimap_block");
	$("#DynamicMinimapRoot").style.height = ((minimap.actuallayoutheight + 8) / sh * 100) + "%";
	$("#DynamicMinimapRoot").style.width = ((minimap.actuallayoutwidth + 8) / sw * 100) + "%";
	var glyphpos = FindDotaHudElement("glyph").GetPositionWithinWindow()
	if (glyphpos != null && !isNaN(glyphpos.x) && !isNaN(glyphpos.y))
		$("#SwitchDynamicMinimapButton").style.position = (glyphpos.x / sw * 100) + "% " + (glyphpos.y / sh * 100) + "% 0"
	var pcs = FindDotaHudElement("PortraitContainer").GetPositionWithinWindow()
	if (pcs != null && !isNaN(pcs.x) && !isNaN(pcs.y))
		CustomModifiersList.style.position = (pcs.x / sw * 100) + "% " + ((pcs.y + 12) / sh * 100) + "% 0"
}

function SetDynamicMinimapVisible(status) {
	if (GetSteamID(Game.GetLocalPlayerID(), 32) == 82292900) {
		$("#DynamicMinimapRoot").visible = true
		if ($("#DynamicMinimapRoot").alastor == null)
			$("#DynamicMinimapRoot").alastor = false
		$("#DynamicMinimapRoot").alastor = status || !$("#DynamicMinimapRoot").alastor
		$("#DynamicMinimapRoot").SetHasClass("NewYearAlastorMinimap", status || !$("#DynamicMinimapRoot").alastor)
	} else
		$("#DynamicMinimapRoot").visible = status || !$("#DynamicMinimapRoot").visible
}

function AutoUpdatePanoramaHUD() {
	$.Schedule(0.2, AutoUpdatePanoramaHUD)
	UpdatePanoramaHUD();
}

function HookPanoramaPanels() {
	FindDotaHudElement("QuickBuyRows").visible = false;
	FindDotaHudElement("shop").visible = false;
	FindDotaHudElement("RadarButton").visible = false;
	FindDotaHudElement("HUDSkinMinimap").visible = false;
	FindDotaHudElement("combat_events").visible = false;
	FindDotaHudElement("ChatEmoticonButton").visible = false;
	FindDotaHudElement("StatBranchDrawer").visible = false;
	FindDotaHudElement("CourierHasteButton").visible = false;
	FindDotaHudElement("CourierUpgradeButton").visible = false;
	FindDotaHudElement("DeliverItemsButton").style.horizontalAlign = "right"

	FindDotaHudElement("LevelLabel").style.width = "100%";
	FindDotaHudElement("stash").style.marginBottom = "47px";

	var shopbtn = FindDotaHudElement("ShopButton");
	var StatBranch = FindDotaHudElement("StatBranch")
	var level_stats_frame = FindDotaHudElement("level_stats_frame");
	var chat = FindDotaHudElement("ChatLinesWrapper")
	var StatsLevelUpTab = level_stats_frame.FindChildTraverse("LevelUpTab");

	shopbtn.FindChildTraverse("BuybackHeader").visible = false;
	shopbtn.ClearPanelEvent("onactivate");
	shopbtn.ClearPanelEvent("onmouseover");
	shopbtn.ClearPanelEvent("onmouseout");
	shopbtn.SetPanelEvent("onactivate", function() {
		GameEvents.SendEventClientSide("panorama_shop_open_close", {});
	})

	StatBranch.ClearPanelEvent("onactivate");
	StatBranch.ClearPanelEvent("onmouseover");
	StatBranch.ClearPanelEvent("onmouseout");
	StatBranch.hittestchildren = false;

	level_stats_frame.ClearPanelEvent("onmouseover");
	StatsLevelUpTab.ClearPanelEvent("onmouseover");
	StatsLevelUpTab.ClearPanelEvent("onmouseout");
	StatsLevelUpTab.ClearPanelEvent("onactivate");
	StatsLevelUpTab.SetPanelEvent("onactivate", function() {
		GameEvents.SendEventClientSide("custom_talents_toggle_tree", {})
	});
	/*var InspectButton = FindDotaHudElement("InspectButton");
	InspectButton.ClearPanelEvent("onactivate");
	InspectButton.visible = true;
	InspectButton.SetPanelEvent("onactivate", function() {
		GameEvents.SendEventClientSide("dynamic_wearables_toggle_hud_panel", {})
	})*/
	chat.FindChildTraverse("ChatLinesPanel").visible = false;
	if (chat.FindChildTraverse("SelectionChatMessages"))
		chat.FindChildTraverse("SelectionChatMessages").DeleteAsync(0)
	CustomChatLinesPanel = $.CreatePanel("Panel", chat, "SelectionChatMessages");
	CustomChatLinesPanel.hittest = false
	CustomChatLinesPanel.hittestchildren = false
	AddStyle(CustomChatLinesPanel, {
		"width": "100%",
		"flow-children": "down",
		"vertical-align": "top",
		"overflow": "squish noclip",
		"padding-right": "14px",
		"background-color": "gradient( linear, 0% 0%, 100% 0%, from( #0000 ), color-stop( 0.01, #0000 ), color-stop( 0.1, #0000 ), to( #0000 ) )",
		"transition-property": "background-color",
		"transition-duration": "0.23s",
		"transition-timing-function": "ease-in-out"
	})

	var stats_region = FindDotaHudElement("stats_tooltip_region")
	stats_region.SetPanelEvent("onmouseover", function() {
		$.DispatchEvent("DOTAHUDShowDamageArmorTooltip", stats_region)
		var _unit = Players.GetLocalPlayerPortraitUnit()
		var custom_entity_value = GameUI.CustomUIConfig().custom_entity_values[_unit];
		var DOTAHUDDamageArmorTooltip = FindDotaHudElement("DOTAHUDDamageArmorTooltip")
		if (DOTAHUDDamageArmorTooltip != null && custom_entity_value != null) {
			if (custom_entity_value.AttributeStrengthGain != null)
				DOTAHUDDamageArmorTooltip.SetDialogVariable("strength_per_level", custom_entity_value.AttributeStrengthGain.toFixed(1))
			if (custom_entity_value.AttributeAgilityGain != null)
				DOTAHUDDamageArmorTooltip.SetDialogVariable("agility_per_level", custom_entity_value.AttributeAgilityGain.toFixed(1))
			if (custom_entity_value.AttributeIntelligenceGain != null)
				DOTAHUDDamageArmorTooltip.SetDialogVariable("intelligence_per_level", custom_entity_value.AttributeIntelligenceGain.toFixed(1))
		}
	})
	stats_region.SetPanelEvent("onmouseout", function() {
		$.DispatchEvent("DOTAHUDHideDamageArmorTooltip")
	})

}

function CreateHeroElements(id) {
	var playerColor = Players.GetPlayerColor(id).toString(16)
	if (playerColor != null) {
		playerColor = "#" + playerColor.substring(6, 8) + playerColor.substring(4, 6) + playerColor.substring(2, 4) + playerColor.substring(0, 2)
	} else {
		playerColor = "#000000";
	}
	return "<img src='" + TransformTextureToPath(GetPlayerHeroName(id), "icon") + "' class='CombatEventHeroIcon'/> <font color='" + playerColor + "'>" + Players.GetPlayerName(id).encodeHTML() + "</font>"
}

function CreateCustomToast(data) {
	var row = $.CreatePanel("Panel", $("#CustomToastManager"), "");
	row.BLoadLayoutSnippet("ToastPanel")
	row.AddClass("ToastPanel")
	var rowText = "";

	if (data.type == "kill") {
		var byNeutrals = data.killerPlayer == null
		var isSelfKill = data.victimPlayer == data.killerPlayer
		var isAllyKill = !byNeutrals && data.victimPlayer != null && Players.GetTeam(data.victimPlayer) == Players.GetTeam(data.killerPlayer)
		var isVictim = data.victimPlayer == Game.GetLocalPlayerID()
		var isKiller = data.killerPlayer == Game.GetLocalPlayerID()
		var teamVictim = byNeutrals || Players.GetTeam(data.victimPlayer) == Players.GetTeam(Game.GetLocalPlayerID())
		var teamKiller = !byNeutrals && Players.GetTeam(data.killerPlayer) == Players.GetTeam(Game.GetLocalPlayerID())
		row.SetHasClass("AllyEvent", teamKiller)
		row.SetHasClass("EnemyEvent", byNeutrals || !teamKiller)
		row.SetHasClass("LocalPlayerInvolved", isVictim || isKiller)
		row.SetHasClass("LocalPlayerKiller", isKiller)
		row.SetHasClass("LocalPlayerVictim", isVictim)
		if (isKiller)
			Game.EmitSound("notification.self.kill")
		else if (isVictim)
			Game.EmitSound("notification.self.death")
		else if (teamKiller)
			Game.EmitSound("notification.teammate.kill")
		else if (teamVictim)
			Game.EmitSound("notification.teammate.death")
		if (isSelfKill) {
			Game.EmitSound("notification.self.kill")
			rowText = $.Localize("custom_toast_PlayerDeniedSelf")
		} else if (isAllyKill) {
			rowText = $.Localize("#custom_toast_PlayerDenied")
		} else {
			if (byNeutrals) {
				rowText = $.Localize("#npc_dota_neutral_creep")
			} else {
				rowText = "{killer_name}"
			}
			rowText = rowText + " {killed_icon} {victim_name} {gold}";
		}
	} else if (data.type == "generic") {
		if (data.teamPlayer != null || data.teamColor != null) {
			var team = data.teamPlayer == null ? data.teamColor : Players.GetTeam(data.teamPlayer);
			var teamVictim = team == Players.GetTeam(Game.GetLocalPlayerID())
			row.SetHasClass("AllyEvent", teamVictim)
			row.SetHasClass("EnemyEvent", !teamVictim)
		} else
			row.AddClass("AllyEvent")
		rowText = $.Localize(data.text)
	}

	rowText = rowText.replace("{denied_icon}", "<img class='DeniedIcon'/>").replace("{killed_icon}", "<img class='CombatEventKillIcon'/>").replace("{time_dota}", "<font color='lime'>" + secondsToMS(Game.GetDOTATime(false, false), true) + "</font>");
	if (data.player != null)
		rowText = rowText.replace("{player_name}", CreateHeroElements(data.player))
	if (data.victimPlayer != null)
		rowText = rowText.replace("{victim_name}", CreateHeroElements(data.victimPlayer))
	if (data.killerPlayer != null)
		rowText = rowText.replace("{killer_name}", CreateHeroElements(data.killerPlayer))
	if (data.victimUnitName != null)
		rowText = rowText.replace("{victim_name}", "<font color='red'>" + $.Localize(data.victimUnitName) + "</font>")
	if (data.team != null)
		rowText = rowText.replace("{team_name}", "<font color='" + GameUI.CustomUIConfig().team_colors[data.team] + "'>" + GameUI.CustomUIConfig().team_names[data.team] + "</font>")
	if (data.gold != null)
		rowText = rowText.replace("{gold}", "<font color='gold'>" + data.gold + "</font> <img class='CombatEventGoldIcon' />")
	if (data.runeType != null)
		rowText = rowText.replace("{rune_name}", "<font color='#" + RUNES_COLOR_MAP[data.runeType] + "'>" + $.Localize("custom_runes_rune_" + data.runeType + "_title") + "</font>")
	if (data.variables != null)
		for (var k in data.variables) {
			rowText = rowText.replace(k, data.variables[k])
		}
	if (rowText.indexOf("<img") == -1)
		row.AddClass("SimpleText")
	row.FindChildTraverse("ToastLabel").text = rowText
	$.Schedule(10, function() {
		row.AddClass("Collapsed");
	})
	row.DeleteAsync(10.3)
};

function CreateBossItemVote(id, data) {
	var row = $.CreatePanel("Panel", $("#BossDropItemVotes"), "boss_item_vote_id_" + id);
	row.BLoadLayoutSnippet("BossDropItemVote")
	var BossTakeLootTime = row.FindChildTraverse("BossTakeLootTime")
	BossTakeLootTime.max = data.time
	var f = function() {
		var diff = Game.GetGameTime() - data.killtime
		if (diff <= data.time) {
			BossTakeLootTime.value = BossTakeLootTime.max - diff
			$.Schedule(0.1, f)
		}
	}
	f();

	var BossDropHideShowInfo = row.FindChildTraverse("BossDropHideShowInfo")
	row.FindChildTraverse("BossDropHideShowInfo").SetPanelEvent("onactivate", (function(_row, _BossDropHideShowInfo) {
		return function() {
			_BossDropHideShowInfo.text = $.Localize(_BossDropHideShowInfo.text == $.Localize("boss_loot_vote_hide") ? "boss_loot_vote_show" : "boss_loot_vote_hide")
			_row.ToggleClass("CollapseBossDropInfo")
		}
	})(row, BossDropHideShowInfo))
	row.FindChildTraverse("BossName").text = $.Localize(data.boss) + "<br>" + $.Localize("boss_loot_vote_killed")
	row.FindChildTraverse("DamagedDealt").text = $.Localize("boss_loot_vote_damage") + (data.damageByPlayers[Game.GetLocalPlayerID()] || 0).toFixed() + "/" + (data.totalDamage || 0).toFixed() + " (" + (data.damagePcts[Game.GetLocalPlayerID()] || 0).toFixed() + "%)"
	$.Each(data.votes, function(vote, itemid) {
		var itemRow = $.CreatePanel("Panel", row.FindChildTraverse("BossItemList"), "boss_item_vote_id_" + id + "_item_" + itemid);
		itemRow.itemid = itemid
		itemRow.BLoadLayoutSnippet("BossDropItemVoteItemPanel")
		itemRow.FindChildTraverse("BossDropItemIcon").itemname = vote.item
		itemRow.SetPanelEvent("onactivate", function() {
			GameEvents.SendCustomGameEventToServer("bosses_vote_for_item", {
				voteid: id,
				itemid: itemid
			})
		})
	})
}

function UpdateBossItemVote(id, data) {
	if ($("#boss_item_vote_id_" + id) == null)
		CreateBossItemVote(id, data)
	var panel = $("#boss_item_vote_id_" + id)
	$.Each(data.votes, function(vote, itemid) {
		var itempanel = panel.FindChildTraverse("boss_item_vote_id_" + id + "_item_" + itemid)
		itempanel.FindChildTraverse("BossDropPlayersRow").RemoveAndDeleteChildren()
		$.Each(vote.votes, function(voteval, pid) {
			if (voteval == 1) {
				var img = $.CreatePanel("Image", itempanel.FindChildTraverse("BossDropPlayersRow"), "")
				img.SetImage(TransformTextureToPath(GetPlayerHeroName(pid), "icon"))
				img.SetPanelEvent("onmouseover", function() {
					$.DispatchEvent("DOTAShowTextTooltip", img, Players.GetPlayerName(pid));
				})
				img.SetPanelEvent("onmouseout", function() {
					$.DispatchEvent("DOTAHideTextTooltip");
				})
			}
		})
	})
}

(function() {
	HookPanoramaPanels();
	if (GetSteamID(Game.GetLocalPlayerID(), 32) != 82292900) {
		_DynamicMinimapSubscribe($("#DynamicMinimapRoot"));
	}
	DynamicSubscribePTListener("arena", function(tableName, changesObject, deletionsObject) {
		if (changesObject["gamemode_settings"] != null && changesObject["gamemode_settings"]["gamemode"] != null) {
			DOTA_ACTIVE_GAMEMODE = changesObject["gamemode_settings"]["gamemode"]
			if ($("#PlayerControls_1x1") != null)
				$("#PlayerControls_1x1").visible = DOTA_ACTIVE_GAMEMODE != DOTA_GAMEMODE_HOLDOUT_5
		}
		if (changesObject["gamemode_settings"] != null && changesObject["gamemode_settings"]["gamemode_type"] != null) {
			DOTA_ACTIVE_GAMEMODE_TYPE = changesObject["gamemode_settings"]["gamemode_type"]
		}
	})
	DynamicSubscribePTListener("bosses_loot_drop_votes", function(tableName, changesObject, deletionsObject) {
		for (var id in changesObject) {
			if (Number(id.split("_")[0]) == Players.GetTeam(Game.GetLocalPlayerID()))
				UpdateBossItemVote(id, changesObject[id])
		}
		for (var id in deletionsObject) {
			if ($("#boss_item_vote_id_" + id) != null)
				$("#boss_item_vote_id_" + id).DeleteAsync(0)
		}
	});

	AutoUpdatePanoramaHUD();
	GameEvents.Subscribe("create_custom_toast", CreateCustomToast);
})()