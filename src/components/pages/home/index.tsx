import Link from "next/link";
import type React from "react";
import { Suspense } from "react";
import { LoaderIcon } from "react-hot-toast";
import SlideshowLoader from "./loader";

const HomePage: React.FC = async () => {
	return (
		<>
			<main className="px-4 flex items-center justify-center h-full w-full min-h-[calc(100dvh-15rem+)]">
				<div className="flex flex-col items-center w-full h-full">
					<div className="w-full flex flex-col items-center justify-center h-full">
						<div className="flex mx-auto max-w-fit gap-4">
							<Link
								href="/market/ordinals"
								className="flex flex-col btn md:btn-lg btn-ghost hover:border-neutral font-bold mb-4 group transition"
							>
								Ordinals
								<span className="font-normal text-xs text-warning/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
									Art NFTs
								</span>
							</Link>
							<Link
								href="/market/bsv20"
								className="flex flex-col btn md:btn-lg btn-ghost hover:border-neutral font-bold mb-4 group transition"
							>
								BSV20
								<span className="font-normal text-xs text-warning/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
									Degen FTs
								</span>
							</Link>
							<Link
								href="/market/bsv21"
								className="flex flex-col btn md:btn-lg btn-ghost hover:border-neutral  font-bold mb-4 group transition"
							>
								BSV21
								<span className="font-normal text-xs text-warning/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
									Pro FTs
								</span>
							</Link>
						</div>

						<div className="divider divider-warning w-64 mx-auto text-warning/50">
							BROWSE DEX
						</div>

						<Suspense
							fallback={
								<div className="w-96 h-fit flex items-center justify-center">
									<LoaderIcon />
								</div>
							}
						>
							<SlideshowLoader />
						</Suspense>
					</div>
				</div>
			</main>
		</>
	);
};

export default HomePage;
