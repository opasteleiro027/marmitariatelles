"use client";

import { useRef, useState } from "react";
import type {
  DeliveryAreaReference,
  LocatedAddress,
} from "../../domain/address-location.types";
import { describeAddressAreaResult, type AddressAreaResult } from "../../domain/describe-address-area-result";
import { findMatchingDeliveryArea } from "../../domain/match-delivery-area";
import {
  formatPostalCode,
  normalizePostalCode,
} from "../../domain/normalize-location-name";
import {
  requestAddressByCoordinates,
  requestAddressByPostalCode,
} from "../../infrastructure/address-lookup-http-client";
import {
  locationErrorMessage,
  requestCurrentPosition,
} from "../../infrastructure/request-current-position";
import styles from "./address-location-fields.module.css";

type AddressFormState = Omit<LocatedAddress, "approximate" | "attribution"> & {
  complement: string;
  referencePoint: string;
};

const INITIAL_ADDRESS: AddressFormState = {
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "Serra",
  state: "ES",
  referencePoint: "",
};

export function AddressLocationFields({
  deliveryAreas,
  deliveryAreaId,
  onDeliveryAreaChange,
}: {
  deliveryAreas: Array<
    DeliveryAreaReference & {
      label: string;
      formattedFee: string;
    }
  >;
  deliveryAreaId: string;
  onDeliveryAreaChange: (areaId: string) => void;
}) {
  const [address, setAddress] = useState(INITIAL_ADDRESS);
  const [loading, setLoading] = useState<"gps" | "postal-code" | null>(null);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");
  const [showAttribution, setShowAttribution] = useState(false);
  const lastPostalCode = useRef("");
  const selectedDeliveryArea = deliveryAreas.find(
    (area) => area.id === deliveryAreaId,
  );

  async function useCurrentLocation() {
    setMessage("");
    if (!navigator.geolocation) {
      showError("Este navegador não oferece localização. Preencha o endereço manualmente.");
      return;
    }
    setLoading("gps");
    try {
      const position = await requestCurrentPosition();
      const result = await requestAddressByCoordinates(
        position.coords.latitude,
        position.coords.longitude,
      );
      const match = applyLocatedAddress(result);
      setShowAttribution(true);
      showLookupResult(describeAddressAreaResult(result.neighborhood, match, "gps"));
    } catch (reason) {
      showError(locationErrorMessage(reason));
    } finally {
      setLoading(null);
    }
  }

  async function lookupPostalCode() {
    const postalCode = normalizePostalCode(address.postalCode);
    if (postalCode.length !== 8) {
      showError("Informe um CEP com 8 números.");
      return;
    }
    if (postalCode === lastPostalCode.current) return;
    setLoading("postal-code");
    setMessage("");
    try {
      const result = await requestAddressByPostalCode(postalCode);
      lastPostalCode.current = postalCode;
      const match = applyLocatedAddress(result);
      setShowAttribution(false);
      showLookupResult(
        describeAddressAreaResult(result.neighborhood, match, "postal-code"),
      );
    } catch (reason) {
      showError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível consultar o CEP.",
      );
    } finally {
      setLoading(null);
    }
  }

  function applyLocatedAddress(result: LocatedAddress) {
    const nextAddress = {
      ...address,
      postalCode: result.postalCode || address.postalCode,
      street: result.street || address.street,
      number: result.number || address.number,
      neighborhood: result.neighborhood || address.neighborhood,
      city: result.city || address.city,
      state: result.state || address.state,
    };
    setAddress(nextAddress);
    const match = findMatchingDeliveryArea(nextAddress, deliveryAreas);
    onDeliveryAreaChange(match?.id ?? "");
    return match;
  }

  function update(field: keyof AddressFormState, value: string) {
    const nextAddress = { ...address, [field]: value };
    setAddress(nextAddress);
    if (field === "neighborhood" || field === "city") {
      const match = findMatchingDeliveryArea(nextAddress, deliveryAreas);
      const nextDeliveryAreaId = match?.id ?? "";
      if (nextDeliveryAreaId !== deliveryAreaId) {
        onDeliveryAreaChange(nextDeliveryAreaId);
      }
    }
    if (field === "postalCode") {
      lastPostalCode.current = "";
      setMessage("");
      if (deliveryAreaId) onDeliveryAreaChange("");
    }
  }

  function showError(value: string) {
    setMessageKind("error");
    setMessage(value);
  }

  function showLookupResult(result: AddressAreaResult) {
    setMessageKind(result.kind);
    setMessage(result.message);
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.locationButton}
        type="button"
        onClick={useCurrentLocation}
        disabled={loading !== null}
      >
        {loading === "gps" ? "Localizando..." : "Usar minha localização"}
      </button>
      <p className={styles.privacy}>
        Com sua permissão, enviaremos as coordenadas ao OpenStreetMap somente
        para sugerir este endereço. O GPS é opcional e o endereço continua
        editável.
      </p>

      <div
        className={`${styles.areaResult} ${
          selectedDeliveryArea ? "" : styles.areaPending
        }`}
      >
        <strong>Área de entrega</strong>
        <span>
          {selectedDeliveryArea
            ? `${selectedDeliveryArea.label} — ${selectedDeliveryArea.formattedFee}`
            : "Informe o CEP para identificar o bairro e a taxa automaticamente."}
        </span>
      </div>

      <div className={styles.addressGrid}>
        <label>
          CEP
          <span className={styles.postalCodeControl}>
            <input
              name="postalCode"
              value={formatPostalCode(address.postalCode)}
              onChange={(event) => update("postalCode", normalizePostalCode(event.target.value))}
              onBlur={() => void lookupPostalCode()}
              inputMode="numeric"
              autoComplete="postal-code"
              required
            />
            <button
              type="button"
              onClick={() => void lookupPostalCode()}
              disabled={loading !== null}
            >
              {loading === "postal-code" ? "Buscando..." : "Buscar"}
            </button>
          </span>
        </label>
        <label>
          Rua
          <input
            name="street"
            value={address.street}
            onChange={(event) => update("street", event.target.value)}
            autoComplete="address-line1"
            required
          />
        </label>
        <label>
          Número
          <input
            name="number"
            value={address.number}
            onChange={(event) => update("number", event.target.value)}
            inputMode="numeric"
            required
          />
        </label>
        <label>
          Complemento
          <input
            name="complement"
            value={address.complement}
            onChange={(event) => update("complement", event.target.value)}
            autoComplete="address-line2"
          />
        </label>
        <label>
          Bairro
          <input
            name="neighborhood"
            value={address.neighborhood}
            onChange={(event) => update("neighborhood", event.target.value)}
            autoComplete="address-level3"
            required
          />
        </label>
        <label>
          Cidade
          <input
            name="city"
            value={address.city}
            onChange={(event) => update("city", event.target.value)}
            autoComplete="address-level2"
            required
          />
        </label>
        <label>
          Estado
          <input
            name="state"
            value={address.state}
            onChange={(event) => update("state", event.target.value.toUpperCase().slice(0, 2))}
            autoComplete="address-level1"
            maxLength={2}
            required
          />
        </label>
        <label>
          Referência
          <input
            name="referencePoint"
            value={address.referencePoint}
            onChange={(event) => update("referencePoint", event.target.value)}
          />
        </label>
      </div>

      {message ? (
        <p
          className={messageKind === "error" ? styles.error : styles.success}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
      {showAttribution ? (
        <a
          className={styles.attribution}
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap contributors
        </a>
      ) : null}
    </div>
  );
}
