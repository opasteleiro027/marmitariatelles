import assert from "node:assert/strict";
import test from "node:test";
import {
  changeMarmitaOptionQuantity,
  shouldAdvanceMarmitaStep,
} from "../modules/storefront/domain/marmita-configurator-flow";
import type { StorefrontMarmitaGroup } from "../modules/storefront/domain/storefront.types";

const singleGroup: StorefrontMarmitaGroup = {
  id: "massa",
  name: "Escolha sua massa",
  role: "base",
  selectionType: "single",
  options: [
    {
      id: "penne",
      name: "Penne",
      additionalPriceInCents: 0,
      available: true,
    },
  ],
};

const complementGroup: StorefrontMarmitaGroup = {
  ...singleGroup,
  id: "complementos",
  name: "Escolha os complementos",
  role: "protein",
  selectionType: "multiple",
  options: Array.from({ length: 6 }, (_, index) => ({
    id: `complemento-${index + 1}`,
    name: `Complemento ${index + 1}`,
    additionalPriceInCents: 0,
    available: true,
  })),
};

test("avança imediatamente depois de uma escolha única", () => {
  const quantities = changeMarmitaOptionQuantity({
    current: {},
    delta: 1,
    group: singleGroup,
    maximum: 1,
    optionId: "penne",
  });

  assert.equal(
    shouldAdvanceMarmitaStep({
      changed: true,
      delta: 1,
      group: singleGroup,
      maximum: 1,
      quantities,
    }),
    true,
  );
});

test("só avança os complementos quando o limite do pote é atingido", () => {
  const fiveSelected = Object.fromEntries(
    complementGroup.options.slice(0, 5).map((option) => [option.id, 1]),
  );
  const sixSelected = {
    ...fiveSelected,
    [complementGroup.options[5].id]: 1,
  };

  assert.equal(
    shouldAdvanceMarmitaStep({
      changed: true,
      delta: 1,
      group: complementGroup,
      maximum: 6,
      quantities: fiveSelected,
    }),
    false,
  );
  assert.equal(
    shouldAdvanceMarmitaStep({
      changed: true,
      delta: 1,
      group: complementGroup,
      maximum: 6,
      quantities: sixSelected,
    }),
    true,
  );
});

test("não avança ao remover uma escolha", () => {
  assert.equal(
    shouldAdvanceMarmitaStep({
      changed: true,
      delta: -1,
      group: complementGroup,
      maximum: 6,
      quantities: {},
    }),
    false,
  );
});
