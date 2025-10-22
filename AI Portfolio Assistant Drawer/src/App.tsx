import { useState, useMemo } from "react";
import { PortfolioDrawer } from "./components/PortfolioDrawer";
import { PortfolioEditor } from "./components/PortfolioEditor";
import { FloatingButton } from "./components/FloatingButton";

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export interface PortfolioData {
  name: string;
  role: string;
  bio: string;
  projects: Project[];
  experience: {
    title: string;
    company: string;
    period: string;
    description: string;
  };
}

export interface Highlight {
  id: number;
  text: string;
  type: "weak" | "strong";
  suggestion?: string;
  rewrites?: string[]; // Multiple rewrite suggestions
  field: string;
  roles: string[]; // Which roles this applies to
}

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [hasJobDescription, setHasJobDescription] =
    useState(false);
  const [selectedRole, setSelectedRole] = useState("Senior");
  const [hoveredSuggestionId, setHoveredSuggestionId] =
    useState<number | null>(null);
  const [completedSuggestions, setCompletedSuggestions] =
    useState<number[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] =
    useState<number[]>([]);
  const [currentRewriteIndex, setCurrentRewriteIndex] =
    useState<{ [key: number]: number }>({});

  const [portfolioData, setPortfolioData] =
    useState<PortfolioData>({
      name: "Sarah Chen",
      role: "Senior Product Designer",
      bio: "Product designer focused on enterprise SaaS and design systems",
      projects: [
        {
          id: "1",
          title: "Enterprise Dashboard Redesign",
          description:
            "Led the redesign of the main dashboard for a B2B analytics platform. Collaborated with engineering and product teams to implement a new component library.",
          tags: ["UI Design", "Design Systems", "Figma"],
        },
        {
          id: "2",
          title: "Mobile App Onboarding",
          description:
            "Designed an intuitive onboarding flow for a fintech mobile application. Conducted user research and iterative testing.",
          tags: [
            "Mobile Design",
            "User Research",
            "Prototyping",
          ],
        },
        {
          id: "3",
          title: "Design System Implementation",
          description:
            "Built and maintained a comprehensive design system used across multiple product teams. Created documentation and guidelines.",
          tags: [
            "Design Systems",
            "Documentation",
            "Component Library",
          ],
        },
      ],
      experience: {
        title: "Senior Product Designer",
        company: "TechCorp Inc.",
        period: "2021 - Present",
        description:
          "Leading design initiatives for the core product suite. Managing design system and collaborating with cross-functional teams.",
      },
    });

  // Define all possible highlights with role applicability
  const allHighlights: Highlight[] = [
    {
      id: 1,
      text: "Collaborated with",
      type: "weak",
      suggestion:
        "Specify your exact role and impact in the collaboration",
      rewrites: [
        "Led collaboration with",
        "Partnered closely with",
        "Coordinated cross-functional work with",
      ],
      field: "project-1-description",
      roles: ["Mid-Level", "Senior", "Manager", "Leader"],
    },
    {
      id: 2,
      text: "Conducted user research",
      type: "weak",
      suggestion:
        "Add number of users and key insights discovered",
      rewrites: [
        "Interviewed 12 users, uncovering 3 major pain points through",
        "Led user research with 15+ participants, discovering critical insights through",
        "Conducted in-depth research with 10 users, revealing key usability issues through",
      ],
      field: "project-2-description",
      roles: [
        "College Grad",
        "Junior Designer",
        "Mid-Level",
        "Senior",
        "Manager",
        "Leader",
      ],
    },
    {
      id: 3,
      text: "comprehensive design system",
      type: "strong",
      field: "project-3-description",
      roles: ["Mid-Level", "Senior", "Manager", "Leader"],
    },
    {
      id: 4,
      text: "collaborating with cross-functional teams",
      type: "weak",
      suggestion:
        "Describe the team size, dynamics, and your leadership approach",
      rewrites: [
        "coordinating with an 8-person cross-functional team, facilitating weekly design critiques and stakeholder alignment",
        "leading collaboration across product, engineering, and design teams of 12+ members",
        "partnering with cross-functional teams including 5 engineers, 2 PMs, and stakeholders to drive alignment",
      ],
      field: "experience-description",
      roles: ["Senior", "Manager", "Leader"],
    },
    {
      id: 5,
      text: "B2B analytics platform",
      type: "strong",
      field: "project-1-description",
      roles: ["Mid-Level", "Senior", "Manager", "Leader"],
    },
    {
      id: 6,
      text: "Led the redesign",
      type: "weak",
      suggestion:
        "Add measurable business impact or user metrics",
      rewrites: [
        "Led the redesign, increasing user engagement by 45% and reducing support tickets by 30%",
        "Spearheaded the redesign, resulting in $2M ARR growth and 40% faster task completion",
        "Drove the complete redesign, achieving 50% improvement in user satisfaction scores (NPS +25)",
      ],
      field: "project-1-description",
      roles: ["Manager", "Leader"],
    },
    {
      id: 7,
      text: "Designed an intuitive",
      type: "weak",
      suggestion:
        "Support with specific design decisions and user feedback",
      rewrites: [
        "Designed an intuitive flow using progressive disclosure, validated through A/B testing with 1,000+ users showing 35% better completion rates",
        "Created an intuitive experience with card-based navigation, achieving 92% task success rate in usability testing",
        "Crafted an intuitive interface using familiar patterns, reducing onboarding time by 60% based on user feedback",
      ],
      field: "project-2-description",
      roles: [
        "Junior Designer",
        "Mid-Level",
        "Senior",
        "Manager",
        "Leader",
      ],
    },
    {
      id: 8,
      text: "Managing design system",
      type: "weak",
      suggestion: "Quantify scale and organizational impact",
      rewrites: [
        "Managing design system adopted by 15 product teams, reducing design-to-dev time by 40%",
        "Overseeing design system used across 20+ products, enabling 3x faster feature development",
        "Leading design system serving 50+ designers and developers, cutting production time by 50%",
      ],
      field: "experience-description",
      roles: ["Manager", "Leader"],
    },
  ];

  // Filter highlights based on selected role and dismissed suggestions
  const highlights = useMemo(() => {
    return allHighlights.filter(
      (h) =>
        h.roles.includes(selectedRole) &&
        !dismissedSuggestions.includes(h.id),
    );
  }, [selectedRole, dismissedSuggestions]);

  // Handle accepting a rewrite suggestion
  const handleAcceptRewrite = (
    highlightId: number,
    rewriteText: string,
    originalText: string,
  ) => {
    const highlight = highlights.find(
      (h) => h.id === highlightId,
    );
    if (!highlight) return;

    const updatedData = { ...portfolioData };

    // Find and replace the text in the appropriate field
    if (highlight.field.startsWith("project-")) {
      const [, projectId, field] = highlight.field.split("-");
      const projectIndex = updatedData.projects.findIndex(
        (p) => p.id === projectId,
      );
      if (projectIndex !== -1) {
        if (field === "description") {
          updatedData.projects[projectIndex].description =
            updatedData.projects[
              projectIndex
            ].description.replace(originalText, rewriteText);
        }
      }
    } else if (highlight.field.startsWith("experience-")) {
      const field = highlight.field.replace("experience-", "");
      if (field === "description") {
        updatedData.experience.description =
          updatedData.experience.description.replace(
            originalText,
            rewriteText,
          );
      }
    }

    setPortfolioData(updatedData);
    // Mark as completed
    setCompletedSuggestions([
      ...completedSuggestions,
      highlightId,
    ]);
  };

  return (
    <div
      className="h-screen w-full overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0a0a0a 100%)",
      }}
    >
      {/* Portfolio Editor - adjusts width when drawer is open */}
      <div
        className="h-full transition-all duration-300 ease-in-out"
        style={{
          width: isDrawerOpen ? "calc(100% - 400px)" : "100%",
          marginRight: isDrawerOpen ? "400px" : "0",
        }}
      >
        <PortfolioEditor
          onTextSelect={setSelectedText}
          portfolioData={portfolioData}
          onUpdatePortfolio={setPortfolioData}
          highlights={highlights}
          hoveredSuggestionId={hoveredSuggestionId}
          isDrawerOpen={isDrawerOpen}
        />
      </div>

      {/* Glassmorphic Drawer on the right */}
      {isDrawerOpen && (
        <PortfolioDrawer
          onClose={() => setIsDrawerOpen(false)}
          selectedText={selectedText}
          onClearSelection={() => setSelectedText("")}
          portfolioData={portfolioData}
          onJobDescriptionChange={setHasJobDescription}
          highlights={highlights}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          onHoverSuggestion={setHoveredSuggestionId}
          completedSuggestions={completedSuggestions}
          onToggleComplete={setCompletedSuggestions}
          dismissedSuggestions={dismissedSuggestions}
          onDismissSuggestion={setDismissedSuggestions}
          currentRewriteIndex={currentRewriteIndex}
          onRewriteIndexChange={setCurrentRewriteIndex}
          onAcceptRewrite={handleAcceptRewrite}
        />
      )}

      {/* Floating Button when drawer is closed */}
      {!isDrawerOpen && (
        <FloatingButton onClick={() => setIsDrawerOpen(true)} />
      )}
    </div>
  );
}