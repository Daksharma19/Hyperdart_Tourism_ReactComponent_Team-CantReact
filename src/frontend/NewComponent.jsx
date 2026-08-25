import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Popper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import NearMeRoundedIcon from "@mui/icons-material/NearMeRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import TempleBuddhistRoundedIcon from "@mui/icons-material/TempleBuddhistRounded";
import MuseumRoundedIcon from "@mui/icons-material/MuseumRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const GEOAPIFY_API_KEY =
  typeof __GEOAPIFY_API_KEY__ === "string" ? __GEOAPIFY_API_KEY__ : "";
const PEXELS_API_KEY =
  typeof __PEXELS_API_KEY__ === "string" ? __PEXELS_API_KEY__ : "";
const INTENTS = [
  [
    "Landmarks",
    /\blandmarks?\b/i,
    "historic icons and architectural highlights",
  ],
  ["Sights", /\bsights?\b/i, "the city’s essential sightseeing stops"],
  [
    "Points of interest",
    /\bpoints?\s+of\s+interest\b/i,
    "noteworthy places around the city",
  ],
  [
    "Places to visit",
    /\bplaces?\s+to\s+visit\b/i,
    "memorable places for your itinerary",
  ],
  [
    "Things to do",
    /\bthings?\s+to\s+do\b/i,
    "tourism highlights worth building a day around",
  ],
  [
    "Tourist attractions",
    /\btourist\s+attractions?\b/i,
    "top sights and attractions nearby",
  ],
];
const PALETTES = [
  { start: "#8d3f22", end: "#d97732", accent: "#fff2df", ink: "#6f2c18" },
  { start: "#964f28", end: "#c99545", accent: "#fff5df", ink: "#70401d" },
  { start: "#a74630", end: "#d57d52", accent: "#fff0e8", ink: "#852f20" },
  { start: "#74403e", end: "#bd7054", accent: "#fff0ea", ink: "#633331" },
];
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function getLocation(data) {
  const entity = data?.entities?.find(
    (item) =>
      item?.collectionType?.toUpperCase() === "HD_LOCATION" &&
      item?.entityInfo?.geo
  );
  const geo = entity?.entityInfo?.geo;
  if (
    !geo ||
    !Number.isFinite(Number(geo.lat)) ||
    !Number.isFinite(Number(geo.long))
  )
    return null;
  return {
    city: geo.city || entity.word,
    state: geo.state,
    country: geo.country,
    latitude: Number(geo.lat),
    longitude: Number(geo.long),
  };
}

function getIntent(query) {
  const [label, , note] =
    INTENTS.find(([, pattern]) => pattern.test(query)) || INTENTS.at(-1);
  return { label, note };
}

function extractLocationText(query) {
  const match = query.trim().match(/\b(?:in|near)\s+(.+)$/i);
  return (match?.[1] || query).replace(/[?.!,]+$/, "").trim();
}

function getPalette(city = "") {
  const index =
    [...city].reduce((total, character) => total + character.charCodeAt(0), 0) %
    PALETTES.length;
  return PALETTES[index];
}

function getModePalette(city = "", mode = "light") {
  const base = getPalette(city);
  if (mode !== "dark") {
    return {
      ...base,
      pageText: "#2b211d",
      mutedText: "text.secondary",
      heroText: "#fff",
      heroAccentBg: "rgba(255,255,255,.16)",
      heroAccentBorder: "rgba(255,255,255,.48)",
      heroAccentText: "#fff",
      heroActiveChipBg: "#fff2df",
      heroActiveChipText: base.ink,
      heroSearchBg: "#fff",
      heroSearchText: "#2b211d",
      heroButtonBg: "#2d211c",
      heroButtonHover: "#1d1511",
      heroOverlay: "linear-gradient(135deg, rgba(86,37,24,.28), rgba(195,108,70,.26))",
      cardBg: "#fff",
      cardBorder: "#ebddd3",
      cardBorderHover: "#d7b7a4",
      cardShadowHover: "0 12px 28px rgba(104,60,37,.13)",
      badgeBg: "rgba(45, 33, 28, 0.08)",
      badgeText: base.ink,
      iconBg: "rgba(143,94,54,.12)",
      previewBg: "#fffaf3",
      previewBorder: "1px solid rgba(143,94,54,.18)",
      previewShadow: "0 18px 36px rgba(95,55,33,.18)",
      divider: "rgba(143,94,54,.14)",
    };
  }

  return {
    start: "#2f1f1b",
    end: "#5a392f",
    accent: "#3b2924",
    ink: "#f6e7d6",
    pageText: "#f2e9df",
    mutedText: "rgba(242,233,223,.72)",
    heroText: "#fff7ef",
    heroAccentBg: "rgba(255,247,239,.10)",
    heroAccentBorder: "rgba(255,247,239,.24)",
    heroAccentText: "#fff7ef",
    heroActiveChipBg: "#f0dcc5",
    heroActiveChipText: "#2f1f1b",
    heroSearchBg: "rgba(255,250,245,.96)",
    heroSearchText: "#2f1f1b",
    heroButtonBg: "#140f0d",
    heroButtonHover: "#090706",
    heroOverlay: "linear-gradient(135deg, rgba(16,10,8,.34), rgba(76,48,38,.28))",
    cardBg: "#1b1513",
    cardBorder: "#3a2a24",
    cardBorderHover: "#6a4a3f",
    cardShadowHover: "0 12px 28px rgba(0,0,0,.28)",
    badgeBg: "rgba(255,247,239,.10)",
    badgeText: "#f6e7d6",
    iconBg: "rgba(255,247,239,.08)",
    previewBg: "#241b18",
    previewBorder: "1px solid rgba(246,231,214,.12)",
    previewShadow: "0 18px 36px rgba(0,0,0,.34)",
    divider: "rgba(246,231,214,.14)",
  };
}

function getApiCategory(categories = []) {
  return (
    categories.find(
      (item) => item?.startsWith("tourism.") && item !== "tourism.sights"
    ) ||
    categories.find((item) => item?.startsWith("tourism.")) ||
    categories[0] ||
    ""
  );
}

function formatCategory(categories = []) {
  const category = getApiCategory(categories);
  return category
    ? category
        .split(".")
        .pop()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Sight";
}

function placeDescription(properties) {
  if (properties.description?.trim()) return properties.description.trim();
  const category = formatCategory(properties.categories);
  return `A ${category.toLowerCase()} worth adding to your ${properties.city ? `${properties.city} ` : ""}itinerary.`;
}

function geoapifyDescription(properties) {
  return properties.description?.trim() || placeDescription(properties);
}

function buildWikipediaUrl(placeName, city) {
  const query = [placeName, city].filter(Boolean).join(" ");
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
}

function getPlaceIcon(categories = []) {
  const category = getApiCategory(categories);
  if (/museum/i.test(category)) return <MuseumRoundedIcon fontSize="inherit" />;
  if (/historic|heritage|castle|archaeological|ruins/i.test(category))
    return <AccountBalanceRoundedIcon fontSize="inherit" />;
  if (/viewpoint|observation|panorama/i.test(category))
    return <LandscapeRoundedIcon fontSize="inherit" />;
  if (/monument|memorial|landmark/i.test(category))
    return <TempleBuddhistRoundedIcon fontSize="inherit" />;
  return <PlaceRoundedIcon fontSize="inherit" />;
}

function getDynamicFilters(places) {
  const categories = new Set();
  places.forEach((place) => {
    const category = getApiCategory(place?.properties?.categories || []);
    if (category) categories.add(category);
  });
  return [
    { id: "all", label: "All sights" },
    ...Array.from(categories).map((category) => ({
      id: category,
      label: formatCategory([category]),
    })),
  ];
}

function matchesAnyFilter(place, selectedFilters) {
  if (selectedFilters.length === 0) return true;
  if (selectedFilters.includes("all")) return true;
  const category = getApiCategory(place?.properties?.categories || []);
  return selectedFilters.includes(category);
}

function MiniMap({ latitude, longitude }) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  return (
    <Box
      sx={{
        position: "relative",
        height: 180,
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        mb: 1,
        border: "1px solid rgba(143,94,54,.16)",
        cursor: "pointer",
      }}
      role="link"
      tabIndex={0}
      onClick={() => window.open(googleMapsUrl, "_blank", "noreferrer")}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.open(googleMapsUrl, "_blank", "noreferrer");
        }
      }}
      title="Open in Google Maps"
    >
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1001,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 999,
          bgcolor: "rgba(45, 33, 28, 0.82)",
          color: "#fff",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.3,
          pointerEvents: "none",
          boxShadow: "0 6px 16px rgba(0,0,0,.18)",
        }}
      >
        <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
        Map redirect
      </Box>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </Box>
  );
}

function preloadImage(src) {
  if (!src) return;
  const image = new Image();
  image.src = src;
}

async function fetchPexelsImage(query, signal) {
  if (!PEXELS_API_KEY || !query) return [];
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`,
    {
      headers: { Authorization: PEXELS_API_KEY },
      signal,
    }
  );
  if (!response.ok) return [];
  const data = await response.json();
  return (data?.photos || [])
    .map((photo) => photo?.src?.landscape)
    .filter(Boolean);
}

function getInsightImages(insight) {
  if (insight?.images?.length) return insight.images;
  return insight?.image ? [insight.image] : [];
}

function HeroBackdrop({ images }) {
  const theme = useTheme();
  const overlay =
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, rgba(16,10,8,.34), rgba(76,48,38,.28))"
      : "linear-gradient(135deg, rgba(86,37,24,.28), rgba(195,108,70,.26))";
  const smokeOne =
    theme.palette.mode === "dark"
      ? "radial-gradient(ellipse at center, rgba(224,139,92,.24), rgba(92,48,35,.08) 48%, transparent 72%)"
      : "radial-gradient(ellipse at center, rgba(255,190,126,.28), rgba(164,77,42,.08) 48%, transparent 72%)";
  const smokeTwo =
    theme.palette.mode === "dark"
      ? "radial-gradient(ellipse at center, rgba(180,99,70,.2), rgba(52,29,25,.08) 48%, transparent 72%)"
      : "radial-gradient(ellipse at center, rgba(226,132,77,.2), rgba(117,53,33,.06) 48%, transparent 72%)";
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [images]);

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        "@keyframes scoutSmokeA": {
          "0%": { transform: "translate(-18%, 12%) scale(0.9) rotate(-8deg)" },
          "50%": { transform: "translate(10%, -8%) scale(1.15) rotate(6deg)" },
          "100%": { transform: "translate(24%, 8%) scale(1.02) rotate(12deg)" },
        },
        "@keyframes scoutSmokeB": {
          "0%": { transform: "translate(24%, -10%) scale(1.05) rotate(10deg)" },
          "50%": { transform: "translate(-12%, 14%) scale(0.88) rotate(-5deg)" },
          "100%": { transform: "translate(-24%, -4%) scale(1.12) rotate(-14deg)" },
        },
      }}
    >
      {!images.length && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,.18), transparent 30%), radial-gradient(circle at bottom left, rgba(255,255,255,.12), transparent 28%)",
          }}
        />
      )}
      {images.map((src, index) => (
        <Box
          key={`${src}-${index}`}
          component="img"
          src={src}
          alt=""
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: index === activeIndex ? 0.68 : 0,
            transform: index === activeIndex ? "scale(1.04)" : "scale(1.08)",
            transition: "opacity 180ms ease, transform 1000ms linear",
            filter: "saturate(1.02) contrast(0.98) blur(0.3px)",
          }}
        />
      ))}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: overlay,
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          width: "82%",
          height: "130%",
          left: "-20%",
          top: "-18%",
          background: smokeOne,
          filter: "blur(24px)",
          opacity: 0.9,
          transformOrigin: "center",
          animation: "scoutSmokeA 14s ease-in-out infinite alternate",
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          width: "76%",
          height: "122%",
          right: "-18%",
          bottom: "-28%",
          background: smokeTwo,
          filter: "blur(28px)",
          opacity: 0.85,
          transformOrigin: "center",
          animation: "scoutSmokeB 17s ease-in-out infinite alternate",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,.16), transparent 32%), radial-gradient(circle at bottom left, rgba(255,255,255,.08), transparent 26%)",
        }}
      />
    </Box>
  );
}

function NewComponent({ searchData }) {
  const theme = useTheme();
  const platformLocation = useMemo(() => getLocation(searchData), [searchData]);
  const platformQuery = searchData?.query || "";
  const placement = (searchData?.componentType || searchData?.format || "")
    .toString()
    .toLowerCase();
  const rootRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const isSidebar = placement.includes("sidebar") || (measuredWidth > 0 && measuredWidth <= 420);
  const [searchText, setSearchText] = useState(platformQuery);
  const [activeQuery, setActiveQuery] = useState(platformQuery);
  const [location, setLocation] = useState(platformLocation);
  const [places, setPlaces] = useState([]);
  const [activeFilters, setActiveFilters] = useState(["all"]);
  const [status, setStatus] = useState(platformLocation ? "loading" : "idle");
  const [error, setError] = useState("");
  const [hoveredPlace, setHoveredPlace] = useState(null);
  const [hoverAnchor, setHoverAnchor] = useState(null);
  const [insightCache, setInsightCache] = useState({});
  const [imageIndexes, setImageIndexes] = useState({});
  const hoverDelayRef = useRef(null);
  const intent = useMemo(() => getIntent(activeQuery), [activeQuery]);
  const palette = useMemo(
    () => getModePalette(location?.city, theme.palette.mode),
    [location?.city, theme.palette.mode]
  );
  const filters = useMemo(() => getDynamicFilters(places), [places]);
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => matchesAnyFilter(place, activeFilters));
  }, [places, activeFilters]);

  useEffect(() => {
    const availableFilters = new Set(filters.map((filter) => filter.id));
    setActiveFilters((current) => {
      if (current.includes("all")) return current;
      const next = current.filter((filterId) => availableFilters.has(filterId));
      return next.length ? next : ["all"];
    });
  }, [filters]);
  const heroImages = useMemo(() => {
    const seen = new Set();
    const images = [];
    for (const place of filteredPlaces) {
      const p = place?.properties || {};
      const cacheKey = `${p.name || "this place"}::${location?.city || ""}`;
      const placeImages = getInsightImages(insightCache[cacheKey]);
      const image = placeImages[0];
      if (image && !seen.has(image)) {
        seen.add(image);
        images.push(image);
      }
    }
    return images;
  }, [filteredPlaces, insightCache, location?.city]);

  useEffect(() => {
    if (platformLocation && !activeQuery) {
      setLocation(platformLocation);
      setActiveQuery(platformQuery);
      setSearchText(platformQuery);
    }
  }, [platformLocation, platformQuery, activeQuery]);

  async function submitSearch(event) {
    event.preventDefault();
    const trimmedQuery = searchText.trim();
    if (!trimmedQuery) return;
    if (!GEOAPIFY_API_KEY) {
      setStatus("error");
      setError("The Geoapify key is not available to this component.");
      return;
    }
    setStatus("geocoding");
    setError("");
    setPlaces([]);
    setActiveFilters(["all"]);
    setHoveredPlace(null);
    setHoverAnchor(null);
    try {
      const params = new URLSearchParams({
        text: extractLocationText(trimmedQuery),
        limit: "1",
        apiKey: GEOAPIFY_API_KEY,
      });
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?${params}`
      );
      if (!response.ok) throw new Error("Unable to resolve that location.");
      const feature = (await response.json())?.features?.[0];
      const properties = feature?.properties || {};
      const [longitude, latitude] = feature?.geometry?.coordinates || [];
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
        throw new Error(
          "We couldn’t find that city. Try entering a city name or tourism query."
        );
      setActiveQuery(trimmedQuery);
      setLocation({
        city:
          properties.city ||
          properties.name ||
          extractLocationText(trimmedQuery),
        state: properties.state,
        country: properties.country,
        latitude,
        longitude,
      });
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError.message ||
          "We couldn’t find that location. Please try again."
      );
    }
  }

  useEffect(() => {
    if (!location) return undefined;
    if (!GEOAPIFY_API_KEY) {
      setStatus("error");
      setError("The Geoapify key is not available to this component.");
      return undefined;
    }
    const controller = new AbortController();
    async function findPlaces() {
      setStatus("loading");
      setError("");
      const params = new URLSearchParams({
        categories: "tourism.sights",
        filter: `circle:${location.longitude},${location.latitude},5000`,
        limit: "20",
        apiKey: GEOAPIFY_API_KEY,
      });
      try {
        const response = await fetch(
          `https://api.geoapify.com/v2/places?${params}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error();
        const data = await response.json();
        setPlaces(
          (data?.features || []).filter((place) =>
            place?.properties?.categories?.some((category) =>
              category.startsWith("tourism.")
            )
          )
        );
        setStatus("success");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setStatus("error");
          setError(
            "We couldn’t load attractions right now. Please try again in a moment."
          );
        }
      }
    }
    findPlaces();
    return () => controller.abort();
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    if (!hoveredPlace) return undefined;
    const p = hoveredPlace.properties || {};
    const name = p.name || "this place";
    const city = location?.city || p.city || "";
    const cacheKey = `${name}::${city}`;
    if (insightCache[cacheKey]) return undefined;

    const controller = new AbortController();
    async function loadHoverInsight() {
      const pexelsHeaders = PEXELS_API_KEY ? { Authorization: PEXELS_API_KEY } : {};
      setInsightCache((current) => ({
        ...current,
        [cacheKey]: { loading: true, image: "", images: [], summary: "" },
      }));
      try {
        const pexelsResponse = await (PEXELS_API_KEY
          ? fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(name + " " + city)}&per_page=6&orientation=landscape`,
              { headers: pexelsHeaders, signal: controller.signal }
            )
          : Promise.resolve(null));

        const nextInsight = {
          loading: false,
          image: "",
          images: [],
          summary: geoapifyDescription(p),
        };
        if (pexelsResponse?.ok) {
          const pexelsData = await pexelsResponse.json();
          nextInsight.images = (pexelsData?.photos || [])
            .map((photo) => photo?.src?.landscape)
            .filter(Boolean);
          nextInsight.image = nextInsight.images[0] || "";
        }
        setInsightCache((current) => ({ ...current, [cacheKey]: nextInsight }));
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setInsightCache((current) => ({
            ...current,
            [cacheKey]: { loading: false, image: "", images: [], summary: "" },
          }));
        }
      }
    }
    loadHoverInsight();
    return () => controller.abort();
  }, [hoveredPlace, location?.city]);

  useEffect(() => {
    if (status !== "success" || filteredPlaces.length === 0) return undefined;
    const controller = new AbortController();
    async function warmBackdropImages() {
      for (const place of filteredPlaces) {
        const p = place?.properties || {};
        const name = p.name || "";
        const city = location?.city || p.city || "";
        const cacheKey = `${name || "this place"}::${city}`;
        if (insightCache[cacheKey] && !insightCache[cacheKey]?.loading) continue;
        try {
          const images = await fetchPexelsImage(`${name} ${city}`, controller.signal);
          setInsightCache((current) => {
            const existing = current[cacheKey];
            if (existing && !existing.loading) return current;
            return {
              ...current,
              [cacheKey]: {
                loading: false,
                image: images[0] || "",
                images,
                summary: existing?.summary || geoapifyDescription(p),
              },
            };
          });
        } catch (requestError) {
          if (requestError.name === "AbortError") break;
          setInsightCache((current) => ({
            ...current,
            [cacheKey]: {
              loading: false,
              image: "",
              images: [],
              summary: geoapifyDescription(p),
            },
          }));
        }
      }
    }
    warmBackdropImages();
    return () => controller.abort();
  }, [status, filteredPlaces, location?.city, insightCache]);

  useEffect(() => {
    filteredPlaces.forEach((place) => {
      const p = place?.properties || {};
      const cacheKey = `${p.name || "this place"}::${location?.city || ""}`;
      getInsightImages(insightCache[cacheKey]).forEach(preloadImage);
    });
  }, [filteredPlaces, insightCache, location?.city]);

  useEffect(() => {
    return () => {
      if (hoverDelayRef.current) {
        clearTimeout(hoverDelayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const nextWidth = Math.round(entry?.contentRect?.width || 0);
      setMeasuredWidth((current) => (current === nextWidth ? current : nextWidth));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const containerWidth = isSidebar ? 420 : 720;
  return (
    <Box
      ref={rootRef}
      sx={{
        width: "100%",
        maxWidth: containerWidth,
        mx: "auto",
        p: { xs: 1.5, sm: 3 },
        color: palette.pageText,
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: { xs: 0, sm: 0 },
          color: palette.heroText,
          background: `linear-gradient(135deg, ${palette.start}, ${palette.end})`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 18px 45px rgba(0,0,0,.28)"
              : "0 18px 45px rgba(112,53,28,.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <HeroBackdrop images={heroImages} />
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Box sx={{ minWidth: 0, flex: "1 1 0%" }}>
            <Typography
              component="h1"
              variant={isSidebar ? "h5" : "h3"}
              fontWeight={800}
              sx={{
                mt: 0.5,
                lineHeight: 1.05,
                fontSize: {
                  xs: "1.8rem",
                  sm: isSidebar ? "2rem" : "3.5rem",
                },
                overflowWrap: "anywhere",
              }}
            >
              {location ? `Explore ${location.city}` : "Where will you wander?"}
            </Typography>
            <Typography
              sx={{
                mt: 1,
                opacity: 0.9,
                maxWidth: isSidebar ? "100%" : 560,
                overflowWrap: "anywhere",
              }}
            >
              {location
                ? `A curated starting point for ${intent.note}.`
                : "Search a city to discover its essential sights and attractions."}
            </Typography>
          </Box>
        </Stack>
        <Box
          component="form"
          onSubmit={submitSearch}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "stretch",
            gap: 1,
            mt: 3,
            position: "relative",
            zIndex: 1,
          }}
        >
          <TextField
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Try “landmarks in Rome”"
            aria-label="Search for a city or tourism query"
            size="small"
            sx={{
              flex: "1 1 0%",
              minWidth: 0,
              "& .MuiOutlinedInput-root": {
                bgcolor: palette.heroSearchBg,
                color: palette.heroSearchText,
                borderRadius: 3,
              },
              "& .MuiInputBase-input::placeholder": {
                color: theme.palette.mode === "dark" ? "rgba(47,31,27,.7)" : undefined,
                opacity: 1,
              },
              "& .MuiOutlinedInput-notchedOutline": { border: 0 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            aria-label="Search"
            disabled={status === "geocoding"}
            sx={{
              minWidth: { xs: 48, sm: 108 },
              flex: { xs: "0 0 48px", sm: "0 0 auto" },
              alignSelf: "stretch",
              borderRadius: 3,
              bgcolor: palette.heroButtonBg,
              "&:hover": { bgcolor: palette.heroButtonHover },
            }}
          >
            {status === "geocoding" ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <ExploreRoundedIcon />
            )}
          </Button>
        </Box>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          sx={{ mt: 1.5, position: "relative", zIndex: 1, minWidth: 0 }}
        >
          {filters.map((filter) => (
            <Chip
              key={filter.id}
              size="small"
              label={filter.label}
              clickable
              onClick={() =>
                setActiveFilters((current) => {
                  if (filter.id === "all") return ["all"];
                  const withoutAll = current.filter((item) => item !== "all");
                  const next = withoutAll.includes(filter.id)
                    ? withoutAll.filter((item) => item !== filter.id)
                    : [...withoutAll, filter.id];
                  return next.length === 0 ? ["all"] : next;
                })
              }
              variant={activeFilters.includes(filter.id) ? "filled" : "outlined"}
              sx={
                activeFilters.includes(filter.id)
                  ? {
                      bgcolor: palette.heroActiveChipBg,
                      color: palette.heroActiveChipText,
                      fontWeight: 800,
                      maxWidth: "100%",
                      "& .MuiChip-label": { px: 1, whiteSpace: "normal" },
                    }
                  : {
                      color: palette.heroAccentText,
                      borderColor: palette.heroAccentBorder,
                      maxWidth: "100%",
                      "& .MuiChip-label": { px: 1, whiteSpace: "normal" },
                      "&:hover": { bgcolor: palette.heroAccentBg },
                    }
              }
            />
          ))}
        </Stack>
        {location && (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{ mt: 2, position: "relative", zIndex: 1, minWidth: 0 }}
          >
            <Chip
              size="small"
              icon={<LocationOnRoundedIcon />}
              label={
                location.state
                  ? `${location.city}, ${location.state}`
                  : `${location.city}, ${location.country}`
              }
              sx={{
                bgcolor: palette.heroAccentBg,
                color: palette.heroAccentText,
                maxWidth: "100%",
                "& .MuiChip-icon": { color: palette.heroAccentText },
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                },
              }}
            />
            <Chip
              size="small"
              label={intent.label}
              sx={{
                bgcolor: palette.heroAccentBg,
                color: palette.heroAccentText,
                maxWidth: "100%",
              }}
            />
            {status === "success" && (
              <Chip
                size="small"
                label={`${places.length} discoveries`}
                sx={{
                  bgcolor: palette.heroActiveChipBg,
                  color: palette.heroActiveChipText,
                  fontWeight: 800,
                  maxWidth: "100%",
                }}
              />
            )}
          </Stack>
        )}
      </Box>

      {status === "idle" && (
        <Typography color={palette.mutedText} align="center" sx={{ py: 7 }}>
          Search for “landmarks in Rome”, “sights near Tokyo”, or simply enter
          a city name.
        </Typography>
      )}

      {(status === "loading" || status === "geocoding") && (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
          <CircularProgress size={32} sx={{ color: palette.end }} />
          <Typography color={palette.mutedText}>
            {status === "geocoding"
              ? "Finding that city…"
              : `Finding sights within 5 km of ${location.city}…`}
          </Typography>
        </Stack>
      )}

      {status === "error" && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {status === "success" && places.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No suitable tourism sights were found within 5 km of {location.city}.
        </Alert>
      )}

      {status === "success" && places.length > 0 && (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            flexWrap="wrap"
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mt: 4, mb: 2, rowGap: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <NearMeRoundedIcon sx={{ color: palette.end }} />
              <Typography variant="h6" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                Your local highlights
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color={palette.mutedText}
              sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "auto" } }}
            >
              {filteredPlaces.length} shown
            </Typography>
          </Stack>
          {filteredPlaces.length === 0 ? (
            <Alert severity="info">
              No matching places were returned. Try All sights.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {filteredPlaces.map((place, index) => {
                const p = place.properties || {};
                const latitude = p.lat ?? place?.geometry?.coordinates?.[1];
                const longitude = p.lon ?? place?.geometry?.coordinates?.[0];
                const name = p.name || "Unnamed attraction";
                const mapUrl =
                  latitude != null && longitude != null
                    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
                    : null;
                const wikipediaUrl = buildWikipediaUrl(name, location?.city);
                const cacheKey = `${name}::${location?.city || ""}`;
                const insight = insightCache[cacheKey];
                const tileImages = getInsightImages(insight);
                const activeImageIndex = Math.min(
                  imageIndexes[cacheKey] || 0,
                  Math.max(tileImages.length - 1, 0)
                );
                const activeImage = tileImages[activeImageIndex];
                const showLeft = index % 2 === 1;
                const shortDescription = geoapifyDescription(p);
                const placeIcon = getPlaceIcon(p.categories);
                return (
                  <Grid item xs={12} sm={isSidebar ? 12 : 6} key={`${name}-${index}`}>
                      <Card
                        data-scout-card="true"
                        elevation={0}
                        onMouseEnter={(event) => {
                          if (hoverDelayRef.current) {
                            clearTimeout(hoverDelayRef.current);
                          }
                          const anchor = event.currentTarget;
                          hoverDelayRef.current = setTimeout(() => {
                            setHoveredPlace(place);
                            setHoverAnchor(anchor);
                          }, 2000);
                        }}
                        onMouseLeave={() => {
                          if (hoverDelayRef.current) {
                            clearTimeout(hoverDelayRef.current);
                            hoverDelayRef.current = null;
                          }
                        setHoveredPlace((current) => (current === place ? null : current));
                        setHoverAnchor(null);
                      }}
                        sx={{
                          height: "100%",
                          border: `1px solid ${palette.cardBorder}`,
                          borderRadius: 4,
                          overflow: "hidden",
                        transition: "transform .2s, box-shadow .2s, border-color .2s",
                        bgcolor: palette.cardBg,
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: palette.cardShadowHover,
                          borderColor: palette.cardBorderHover,
                        },
                          position: "relative",
                        }}
                    >
                      {activeImage && (
                        <Box sx={{ position: "relative" }}>
                          <Box
                            component="img"
                            src={activeImage}
                            alt={`${name} photo ${activeImageIndex + 1}`}
                            sx={{
                              width: "100%",
                              height: { xs: 160, sm: isSidebar ? 170 : 180 },
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          {tileImages.length > 1 && (
                            <>
                              <IconButton
                                aria-label={`Previous photo of ${name}`}
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setImageIndexes((current) => ({
                                    ...current,
                                    [cacheKey]:
                                      (activeImageIndex - 1 + tileImages.length) %
                                      tileImages.length,
                                  }));
                                }}
                                sx={{
                                  position: "absolute",
                                  left: 10,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  width: 32,
                                  height: 32,
                                  bgcolor: "rgba(20, 15, 13, .72)",
                                  color: "#fff",
                                  "&:hover": { bgcolor: "rgba(20, 15, 13, .9)" },
                                }}
                              >
                                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton
                                aria-label={`Next photo of ${name}`}
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setImageIndexes((current) => ({
                                    ...current,
                                    [cacheKey]: (activeImageIndex + 1) % tileImages.length,
                                  }));
                                }}
                                sx={{
                                  position: "absolute",
                                  right: 10,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  width: 32,
                                  height: 32,
                                  bgcolor: "rgba(20, 15, 13, .72)",
                                  color: "#fff",
                                  "&:hover": { bgcolor: "rgba(20, 15, 13, .9)" },
                                }}
                              >
                                <ArrowForwardIosRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <Typography
                                variant="caption"
                                sx={{
                                  position: "absolute",
                                  right: 10,
                                  bottom: 8,
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 999,
                                  bgcolor: "rgba(20, 15, 13, .72)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  lineHeight: 1.2,
                                }}
                              >
                                {activeImageIndex + 1}/{tileImages.length}
                              </Typography>
                            </>
                          )}
                        </Box>
                      )}
                      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
                        <Typography
                          variant="caption"
                          sx={{ color: palette.end }}
                          fontWeight={800}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          sx={{ mt: 0.25, lineHeight: 1.25 }}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                bgcolor: palette.iconBg,
                                color: palette.ink,
                                flexShrink: 0,
                                fontSize: 16,
                              }}
                            >
                              {placeIcon}
                            </Box>
                            <Box
                              component="span"
                              sx={{ minWidth: 0, overflowWrap: "anywhere" }}
                            >
                              {name}
                            </Box>
                          </Stack>
                        </Typography>
                        <Box
                          sx={{
                            mt: 1,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.5,
                            borderRadius: 999,
                            bgcolor: palette.badgeBg,
                            color: palette.badgeText,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 0.3,
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (hoverDelayRef.current) {
                              clearTimeout(hoverDelayRef.current);
                              hoverDelayRef.current = null;
                            }
                            setHoveredPlace(place);
                            setHoverAnchor(
                              event.currentTarget.closest('[data-scout-card="true"]')
                            );
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              if (hoverDelayRef.current) {
                                clearTimeout(hoverDelayRef.current);
                                hoverDelayRef.current = null;
                              }
                              setHoveredPlace(place);
                              setHoverAnchor(
                                event.currentTarget.closest('[data-scout-card="true"]')
                              );
                            }
                          }}
                        >
                          Show more
                          <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
                        </Box>
                        <Chip
                          size="small"
                          label={formatCategory(p.categories)}
                          sx={{
                            mt: 1.25,
                            bgcolor: palette.accent,
                            color: palette.ink,
                            fontWeight: 700,
                          }}
                        />
                        <Typography variant="body2" color={palette.mutedText} sx={{ mt: 1.5 }}>
                          {shortDescription}
                        </Typography>
                        {p.formatted && (
                          <Typography
                            variant="body2"
                            color={palette.mutedText}
                            sx={{ mt: 1.5 }}
                          >
                            {p.formatted}
                          </Typography>
                        )}
                        {latitude != null && longitude != null && (
                          <Link
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            underline="hover"
                            sx={{
                              mt: 1.5,
                              display: "inline-flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 0.5,
                              color: palette.ink,
                              fontSize: ".8rem",
                              fontWeight: 700,
                              overflowWrap: "anywhere",
                            }}
                          >
                            <LocationOnRoundedIcon sx={{ fontSize: 15 }} />
                            {Number(latitude).toFixed(4)},{" "}
                            {Number(longitude).toFixed(4)}
                          </Link>
                        )}
                        {isSidebar && hoveredPlace === place && (
                          <Box
                            sx={{
                              mt: 2,
                              pt: 2,
                              borderTop: `1px solid ${palette.divider}`,
                            }}
                          >
                            <MiniMap latitude={latitude} longitude={longitude} />
                            <Box
                              component="a"
                              href={wikipediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              sx={{
                                display: "block",
                                mb: 1,
                                position: "relative",
                                borderRadius: 2,
                                overflow: "hidden",
                              }}
                              title="Open place on Wikipedia"
                            >
                              {activeImage && (
                                <Box
                                  component="img"
                                  src={activeImage}
                                  alt={`${name} photo ${activeImageIndex + 1}`}
                                  sx={{
                                    width: "100%",
                                    height: 140,
                                    objectFit: "cover",
                                    display: "block",
                                    borderRadius: 2,
                                  }}
                                />
                              )}
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 10,
                                  left: 10,
                                  zIndex: 2,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 999,
                                  bgcolor: "rgba(45, 33, 28, 0.82)",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: 0.3,
                                  pointerEvents: "none",
                                  boxShadow: "0 6px 16px rgba(0,0,0,.18)",
                                }}
                              >
                                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                                Wiki redirect
                              </Box>
                            </Box>
                            <Typography variant="subtitle2" fontWeight={800}>
                              Place preview
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {insight?.summary ||
                                (insight?.loading
                                  ? "Loading a short place description..."
                                  : "No short description was found for this place.")}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                      <Popper
                        open={!isSidebar && hoveredPlace === place && Boolean(hoverAnchor)}
                        anchorEl={hoverAnchor}
                        placement={showLeft ? "left-start" : "right-start"}
                        modifiers={[
                          { name: "offset", options: { offset: [0, 12] } },
                        ]}
                        sx={{ zIndex: 1600 }}
                      >
                        <Box
                          sx={{
                            width: 280,
                            maxWidth: "calc(100vw - 32px)",
                            p: 1.25,
                            borderRadius: 3,
                            border: palette.previewBorder,
                            bgcolor: palette.previewBg,
                            color: palette.pageText,
                            boxShadow: palette.previewShadow,
                            overflow: "hidden",
                          }}
                        >
                          <MiniMap latitude={latitude} longitude={longitude} />
                        <Box
                          component="a"
                          href={wikipediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            display: "block",
                            mb: 1,
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                          title="Open place on Wikipedia"
                        >
                          {activeImage && (
                            <Box
                              component="img"
                              src={activeImage}
                              alt={`${name} photo ${activeImageIndex + 1}`}
                              sx={{
                                width: "100%",
                                height: 140,
                                objectFit: "cover",
                                display: "block",
                                borderRadius: 2,
                              }}
                            />
                          )}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              zIndex: 2,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1,
                              py: 0.5,
                              borderRadius: 999,
                              bgcolor: "rgba(45, 33, 28, 0.82)",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: 0.3,
                              pointerEvents: "none",
                              boxShadow: "0 6px 16px rgba(0,0,0,.18)",
                            }}
                          >
                            <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                            Wiki redirect
                          </Box>
                          </Box>
                          <Typography variant="subtitle2" fontWeight={800}>
                            Place preview
                          </Typography>
                          <Typography variant="body2" color={palette.mutedText} sx={{ mt: 0.5 }}>
                            {insight?.summary ||
                              (insight?.loading
                                ? "Loading a short place description..."
                                : "No short description was found for this place.")}
                          </Typography>
                        </Box>
                      </Popper>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}

export default NewComponent;
