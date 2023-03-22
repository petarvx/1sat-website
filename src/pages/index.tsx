import HomePage from "@/components/pages/home";
import AppContext from "@/context";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const App: React.FC<PageProps> = (props) => {
  return (
    <AppContext {...props}>
      <HomePage {...props} />
    </AppContext>
  );
};

export default App;
