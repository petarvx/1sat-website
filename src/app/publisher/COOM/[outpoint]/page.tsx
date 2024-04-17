import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { COOM_BANNERS_BY_OUTPOINT, COOM_OUTPOINTS_BY_SLUGS, COOM_SLUGS_AND_OUTPOINTS } from "../constants";
import { fetchCollectionItems, fetchCollectionMarket } from "@/utils/fetchCollectionData";


const CoOMCollection = async ({ params }: { params: { outpoint: string }}) => {
  let outpoint = params.outpoint;
  const isCoom = COOM_SLUGS_AND_OUTPOINTS.includes(outpoint);
  const isCoomSlug = isCoom && !!COOM_OUTPOINTS_BY_SLUGS[outpoint]

  if (isCoomSlug) {
    outpoint = COOM_OUTPOINTS_BY_SLUGS[outpoint];
  }

  // Get the Ordinal TXO
  let collection: OrdUtxo | undefined;
    const collectionUrl = `${API_HOST}/api/txos/${outpoint}`;

  try {
    const { promise: promiseCollection } =
      http.customFetch<OrdUtxo>(collectionUrl);
    collection = await promiseCollection;
  } catch (e) {
    console.error("Error fetching collection", e, collectionUrl);
	}

  // Get the collection stats
  let stats: CollectionStats | undefined;
  const collectionStatsUrl = `${API_HOST}/api/collections/${outpoint}/stats`;

  try {
    const { promise } = http.customFetch<CollectionStats>(collectionStatsUrl);
    stats = (await promise) || [];
  } catch (e) {
    console.error(e);
  }

  // Get the collection items
  const q = {
    map: {
      subTypeData: {
        collectionId: outpoint,
      },
    },
  };

  const items = await fetchCollectionItems(q) ?? [];
  const market = await fetchCollectionMarket(q) ?? [];

  if (!collection || !stats) {
    return <div>Collection not found</div>;
  }

  return <CollectionPage
          stats={stats}
          marketItems={market}
          items={items}
          collection={collection}
          query={q}
          bannerImage={COOM_BANNERS_BY_OUTPOINT[outpoint]}
        />;
};

export default CoOMCollection;