import HeroExperience from "@/components/hero/HeroExperience";
import SelectedWork from "@/components/work/SelectedWork";
import DreamSpaceHub from "@/components/work/dreamspacehub/DreamSpaceHub";
import DreamHomeTech from "@/components/work/dreamhometech/DreamHomeTech";
import VisionaryControl from "@/components/work/visionarycontrol/VisionaryControl";
import ProjectTransition from "@/components/work/ProjectTransition";
import TechnologyConstellation from "@/components/sections/TechnologyConstellation";
import About from "@/components/sections/About";
import Capabilities from "@/components/sections/Capabilities";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/core/Footer";
import ProjectProgress from "@/components/core/ProjectProgress";

export default function Page() {
  return (
    <main>
      <HeroExperience />
      <SelectedWork />

      <DreamSpaceHub />
      <ProjectTransition
        from="beam"
        to="wire"
        fromLabel={{ number: "01", title: "DreamSpaceHub", caption: "Projector beam" }}
        toLabel={{ number: "02", title: "DreamHomeTech", caption: "3D wireframe" }}
      />

      <DreamHomeTech />
      <ProjectTransition
        from="wire"
        to="grid"
        fromLabel={{ number: "02", title: "DreamHomeTech", caption: "3D wireframe" }}
        toLabel={{ number: "03", title: "Visionary Control", caption: "AR tracking grid" }}
      />

      <VisionaryControl />

      <TechnologyConstellation />
      <About />
      <Capabilities />
      <Contact />
      <Footer />
      <ProjectProgress />
    </main>
  );
}
