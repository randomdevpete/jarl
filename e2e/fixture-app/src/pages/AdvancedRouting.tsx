import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { productAtom, productRatingsAtom, productGalleryAtom, productGalleryImageAtom } from "../routes";
import { Link } from "jarl-react";

const useTitle = (title: string) => {
    useEffect(() => {
        document.title = title;
    }, [title]);
};

// Mirrors demo/source/data/galleryData.js: images "1".."10", each mapping to
// `image=${n-1}` on picsum.photos, so id 1 -> image=0, id 2 -> image=1, etc.
const galleryData: Record<string, string> = {};
for (let n = 1; n <= 10; n += 1) {
    galleryData[String(n)] = `https://picsum.photos/200/300?image=${n - 1}`;
}

const Home = () => {
    useTitle("Advanced Routing - Home - JARL");
    return (
        <div>
            <div data-test="header">Home</div>
            <span data-test-demo-link="advancedRouting" data-test-active="true" />
            <Link route={productAtom} data-test="product-link">
                Product
            </Link>
        </div>
    );
};

const DetailsTab = () => <h2 data-test="details-tab">Details</h2>;
const RatingsTab = () => <h2 data-test="ratings-tab">Ratings</h2>;

const GalleryTab = () => {
    const gallery = useAtomValue(productGalleryImageAtom);
    const imageId = gallery.values?.imageId;
    const url = imageId ? galleryData[imageId] : undefined;
    return (
        <div>
            <h2 data-test="gallery-tab">Gallery</h2>
            {url ? (
                <img data-test="image-full-size" src={url} alt="Full size" />
            ) : (
                <p data-test="missing-image">Image id {imageId} not found!</p>
            )}
            {Object.keys(galleryData).map((id) => (
                <Link
                    key={id}
                    route={productGalleryImageAtom}
                    to={{ imageId: id }}
                    data-test={`gallery-image-link-${id}`}
                >
                    {id}
                </Link>
            ))}
        </div>
    );
};

const Product = () => {
    const ratings = useAtomValue(productRatingsAtom);
    const gallery = useAtomValue(productGalleryAtom);
    useTitle("Advanced Routing - Product - JARL");

    let tab;
    if (gallery.match) {
        tab = <GalleryTab />;
    } else if (ratings.match) {
        tab = <RatingsTab />;
    } else {
        // Default tab, mirrors the v1 demo's `stringify` default-tab trick.
        tab = <DetailsTab />;
    }

    return (
        <div>
            <div data-test="header">Product</div>
            <nav>
                <Link route={productAtom} exact data-test="details-tab-link">
                    Details
                </Link>{" "}
                <Link route={productRatingsAtom} data-test="ratings-tab-link">
                    Ratings
                </Link>{" "}
                <Link route={productGalleryImageAtom} to={{ imageId: "1" }} data-test="gallery-tab-link">
                    Gallery
                </Link>
            </nav>
            {tab}
        </div>
    );
};

// Mirrors demo/cypress/integration/02AdvancedRouting.js.
const AdvancedRouting = () => {
    const product = useAtomValue(productAtom);

    if (product.match) {
        return <Product />;
    }
    return <Home />;
};

export default AdvancedRouting;
