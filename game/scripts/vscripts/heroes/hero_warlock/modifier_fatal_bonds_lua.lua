modifier_fatal_bonds_lua = class({})

function modifier_fatal_bonds_lua:GetEffectName()
	return "particles/units/heroes/hero_warlock/warlock_fatal_bonds_icon.vpcf"
end

function modifier_fatal_bonds_lua:GetEffectAttachType()
	return PATTACH_OVERHEAD_FOLLOW
end

function modifier_fatal_bonds_lua:GetAttributes()
	return MODIFIER_ATTRIBUTE_MULTIPLE
end

function modifier_fatal_bonds_lua:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_TAKEDAMAGE,
		MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE
	}
end

function modifier_fatal_bonds_lua:GetModifierIncomingDamage_Percentage()
	return self:GetAbility():GetSpecialValueFor("bonus_damage_taken")
end

if IsServer() then
	function modifier_fatal_bonds_lua:OnCreated(keys)
		self.FatalBondsBoundUnits = self:GetParent().FatalBondsBoundUnits
		self:GetParent().FatalBondsBoundUnits = nil
	end

	function modifier_fatal_bonds_lua:OnTakeDamage(keys)
		if IsServer() and self:GetParent() == keys.unit and not (keys.inflictor and keys.inflictor == self:GetAbility()) then
			local target = self:GetParent()
			local ability = self:GetAbility()
			if IsValidEntity(target) and target:IsAlive() then
				target:EmitSound("Hero_Warlock.FatalBondsDamage")
				local dmg = keys.damage * ability:GetLevelSpecialValueFor("damage_share_percentage", ability:GetLevel() - 1) * 0.01
				for _,subv in ipairs(self.FatalBondsBoundUnits) do
					if subv and not subv:IsNull() and subv ~= target and not subv:IsInvulnerable() then
						local p = ParticleManager:CreateParticle(ability.hit_pfx, PATTACH_ABSORIGIN_FOLLOW, target)
						ParticleManager:SetParticleControl(p, 1, subv:GetAbsOrigin() + Vector(0,0,64))
						subv:EmitSound("Hero_Warlock.FatalBondsDamage")
						ApplyDamage({victim = subv,
							attacker = self:GetCaster(),
							damage = dmg,
							damage_type = DAMAGE_TYPE_PURE,
							damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
							ability = ability
						})
					end
				end
			end
		end
	end
end