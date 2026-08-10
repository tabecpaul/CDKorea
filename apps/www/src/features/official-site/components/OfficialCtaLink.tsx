"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { AnalyticsEventName } from "@/features/analytics/server/events";

export default function OfficialCtaLink({
  href,
  eventName,
  ctaLocation,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  eventName: AnalyticsEventName;
  ctaLocation: string;
  children: ReactNode;
}) {
  function handleClick() {
    const current = new URLSearchParams(window.location.search);
    const target = new URL(href, window.location.origin);
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const value = current.get(key);
      if (value && !target.searchParams.has(key)) target.searchParams.set(key, value);
    }
    if (props.target === "_blank") window.open(target.toString(), "_blank", "noopener,noreferrer");
    else window.location.assign(target.toString());

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: crypto.randomUUID(), eventName, path: window.location.pathname,
        ctaLocation, utmSource: current.get("utm_source"),
        utmMedium: current.get("utm_medium"), utmCampaign: current.get("utm_campaign"),
        utmContent: current.get("utm_content"),
      }),
      keepalive: true,
    });
  }

  return <a {...props} href={href} onClick={(event) => { event.preventDefault(); handleClick(); }}>{children}</a>;
}
