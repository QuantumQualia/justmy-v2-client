import React from "react";

/** Contact actions are a fragment; Swiper needs one child per slide. */
export function flattenContactActions(contactActions: React.ReactNode): React.ReactNode[] {
  const children =
    React.isValidElement(contactActions) && contactActions.type === React.Fragment
      ? (contactActions.props as { children?: React.ReactNode }).children
      : contactActions;
  return React.Children.toArray(children);
}
