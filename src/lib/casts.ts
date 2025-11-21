import { getCastsByDowntownId } from "@/data/mockCasts";
import { Cast } from "@/types/cast";

export const PAGE_SIZE = 10;

export const getPaginatedCasts = (
  downtownId: number,
  page: number,
  perPage: number = PAGE_SIZE
): {
  casts: Cast[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
} => {
  const all = getCastsByDowntownId(downtownId);
  all.sort((a, b) => b.followers - a.followers);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * perPage;
  const casts = all.slice(start, start + perPage);

  return {
    casts,
    totalCount,
    totalPages,
    currentPage,
  };
};
