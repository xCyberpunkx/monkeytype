import SlimSelect from "slim-select";
import type { DataObjectPartial } from "slim-select/dist/store";
import { getTestActivityCalendar } from "../db";
import * as ServerConfiguration from "../ape/server-configuration";
import * as DB from "../db";

const yearSelector = new SlimSelect({
  select: "#testActivity .yearSelect",
  settings: {
    showSearch: false,
  },
  events: {
    afterChange: async (newVal): Promise<void> => {
      yearSelector?.disable();
      const selected = newVal[0]?.value as string;
      const activity = await getTestActivityCalendar(selected);
      update(activity);
      if ((yearSelector?.getData() ?? []).length > 1) {
        yearSelector?.enable();
      }
    },
  },
});

export function init(
  calendar?: MonkeyTypes.TestActivityCalendar,
  userSignUpDate?: Date
): void {
  if (calendar === undefined) {
    $("#testActivity").addClass("hidden");
    return;
  }
  $("#testActivity").removeClass("hidden");
  initYearSelector("current", userSignUpDate?.getFullYear() || 2022);
  update(calendar);
}

function update(calendar?: MonkeyTypes.TestActivityCalendar): void {
  const container = document.querySelector(
    "#testActivity .activity"
  ) as HTMLElement;
  container.innerHTML = "";

  if (calendar === undefined) {
    updateMonths([]);
    $("#testActivity .nodata").removeClass("hidden");
    return;
  }

  updateMonths(calendar.getMonths());
  $("#testActivity .nodata").addClass("hidden");

  for (const day of calendar.getDays()) {
    const elem = document.createElement("div");
    elem.setAttribute("data-level", day.level);
    if (day.label !== undefined) {
      elem.setAttribute("aria-label", day.label);
      elem.setAttribute("data-balloon-pos", "up");
    }
    container.appendChild(elem);
  }
}

export function initYearSelector(
  selectedYear: number | "current",
  startYear: number
): void {
  const currentYear = new Date().getFullYear();

  const years: DataObjectPartial[] = [
    {
      text: "last 12 months",
      value: "current",
      selected: selectedYear === "current",
    },
  ];
  for (let year = currentYear; year >= startYear; year--) {
    if (
      years.length < 2 ||
      (ServerConfiguration.get()?.users.premium.enabled &&
        DB.getSnapshot()?.isPremium)
    ) {
      years.push({
        text: year.toString(),
        value: year.toString(),
        selected: year === selectedYear,
      });
    }
  }

  yearSelector.setData(years);
  years.length > 1 ? yearSelector.enable() : yearSelector.disable();
}

function updateMonths(months: MonkeyTypes.TestActivityMonth[]): void {
  const element = document.querySelector("#testActivity .months") as Element;

  element.innerHTML = months
    .map(
      (month) =>
        `<div style="grid-column: span ${month.weeks}">${month.text}</div>`
    )
    .join("");
}
