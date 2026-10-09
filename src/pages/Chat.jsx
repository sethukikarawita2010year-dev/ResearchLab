import { useState } from "react";
import { usePdfAttachment, PdfFileInput, PdfChip } from "../components/PdfAttachment";
import { uploadPdf } from "../lib/api";

const A = "/assets";

function Code({ children }) {
  return (
    <code className="bg-[#12151e] border border-[#2a3044] border-solid font-mono text-[13px] leading-[20px] text-[#a5b4fc] px-[7px] py-[1.5px] rounded-[4px] whitespace-nowrap">
      {children}
    </code>
  );
}

function SectionHeader({ num, title, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="content-stretch flex items-center justify-between py-[4px] relative shrink-0 w-full cursor-pointer text-left"
    >
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <span className="font-inter font-semibold text-[#818cf8] text-[16px] tracking-[0.8px] uppercase leading-[24px]">
          {num}
        </span>
        <h3 className="font-inter font-semibold text-[#f1f5f9] text-[16px] tracking-[-0.08px] leading-[26px]">
          {title}
        </h3>
      </div>
      <img
        alt=""
        src={`${A}/chat-caret-up.svg`}
        className={`h-[7.4px] w-[12px] transition-transform duration-200 ${open ? "" : "rotate-180"}`}
      />
    </button>
  );
}

const stats = [
  {
    label: "WMT 2014 EN-DE",
    value: "28.4",
    desc: ["Surpassing prior best ensembles by over", "2.0 BLEU."],
  },
  {
    label: "WMT 2014 EN-FR",
    value: "41.8",
    desc: ["State-of-the-art single-model score trained", "in 3.5 days."],
  },
];

const evidence = [
  { icon: `${A}/chat-evidence-1.svg`, label: "Scaled Dot-Product Attention • p. 4", cls: "h-[11.667px] w-[9.333px]" },
  { icon: `${A}/chat-evidence-2.svg`, label: "Mathematical Derivation • p. 4 eq. 1", cls: "size-[10.5px]" },
  { icon: `${A}/chat-evidence-3.svg`, label: "Section 3.2.1", cls: "h-[7px] w-[10.5px]" },
];

const sources = [
  {
    icon: `${A}/chat-doc.svg`,
    title: "Attention Is All You Need",
    badge: "PDF",
    meta: "15 pages • Vaswani et al. • 8 citations",
  },
  {
    icon: `${A}/chat-doc.svg`,
    title: "FlashAttention: Fast & Exact",
    badge: "PDF",
    meta: "12 pages • Dao et al.",
  },
  {
    icon: `${A}/chat-globe.svg`,
    title: "arxiv:2009.14794 Linear…",
    badge: "WEB",
    meta: "arxiv.org/abs/2009.14794",
  },
  {
    icon: `${A}/chat-hf.svg`,
    title: "HuggingFace Attention Impl.",
    badge: "WEB",
    meta: "huggingface.co/docs/transformers",
  },
];

const sectionTitles = {
  s1: ["01", "Title & Authors & Abstract"],
  s2: ["02", "Problem Statement"],
  s3: ["03", "Methodology"],
  s4: ["04", "Key Results"],
  s5: ["05", "Conclusion"],
};

export default function Chat() {
  const [open, setOpen] = useState({ s1: true, s2: true, s3: true, s4: true, s5: true });
  const [webSearch, setWebSearch] = useState(true);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const { file, error, inputRef, open: openPdf, onChange: onPdfChange, clear: clearPdf } = usePdfAttachment();

  const handleSend = async () => {
    if (sending) return;
    if (!file && !query.trim()) return;

    setSending(true);
    setStatus("");
    try {
      if (file) {
        const uploaded = await uploadPdf(file);
        setStatus(`Attached ${uploaded.filename}`);
      }
      setQuery("");
      clearPdf();
    } catch (err) {
      setStatus(err.message || "Upload failed");
    } finally {
      setSending(false);
    }
  };

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div
      className="content-stretch flex flex-col items-start pl-[260px] relative size-full min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(11, 13, 19) 0%, rgb(11, 13, 19) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
      }}
    >
      <div className="bg-[#0b0d13] content-stretch flex flex-col items-start min-h-screen pt-[64px] px-[24px] relative shrink-0 w-full">
        <div className="content-stretch flex flex-col isolate items-start relative shrink-0 w-full">
          {/* Subheader ribbon */}
          <div className="backdrop-blur-[6px] bg-[rgba(17,20,29,0.95)] border-[#1e2230] border-b border-solid content-stretch flex items-center justify-between pb-[9px] pt-[8px] px-[16px] relative shrink-0 w-full z-[2]">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
              <span className="font-inter font-medium text-[#94a3b8] text-[13px] tracking-[0.13px] leading-[16px] whitespace-nowrap">
                Workspace
              </span>
              <img alt="" src={`${A}/chat-chevron.svg`} className="h-[7px] w-[4.317px] shrink-0" />
              <span className="font-inter font-semibold text-[#e2e8f0] text-[13px] tracking-[0.13px] leading-[16px] whitespace-nowrap">
                Attention_Vaswani_2017.pdf
              </span>
            </div>
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
              <div className="bg-[#2a3044] h-[16px] relative shrink-0 w-px" />
              <button
                type="button"
                className="bg-[#1a1e2b] border border-[#2a3044] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[6px] items-center px-[13px] py-[7px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#20263a]"
              >
                <img alt="" src={`${A}/chat-undock.svg`} className="relative shrink-0 size-[13.5px]" />
                <span className="font-inter font-medium text-[#a5b4fc] text-[13px] text-center tracking-[0.13px] leading-[16px] whitespace-nowrap">
                  Undock Sources
                </span>
              </button>
            </div>
          </div>

          {/* Primary working grid */}
          <div className="content-stretch flex items-start pb-[144px] relative shrink-0 w-full z-[1]">
            <div className="content-stretch flex flex-1 flex-col items-center min-w-px px-[12px] relative self-stretch">
              <div className="content-stretch flex flex-col gap-[16px] items-start max-w-[760px] pt-[16px] relative shrink-0 w-full">
                {/* Structured extraction card */}
                <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex items-center justify-end px-[4px] relative shrink-0 w-full">
                    <span className="font-inter font-semibold text-[#64748b] text-[11px] tracking-[0.33px] leading-[14px]">
                      10:42 AM
                    </span>
                  </div>

                  <div className="relative bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[12px] items-start overflow-hidden pb-[17px] pt-[29px] px-[17px] rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full">
                    <div className="absolute bg-[#6366f1] bottom-0 left-0 top-0 w-[4px]" />

                    {/* Section 1 */}
                    <div className="content-stretch flex flex-col gap-[8px] relative shrink-0 w-full">
                      <SectionHeader
                        {...{ num: sectionTitles.s1[0], title: sectionTitles.s1[1] }}
                        open={open.s1}
                        onToggle={() => toggle("s1")}
                      />
                      {open.s1 && (
                        <div className="bg-[#12151e] border border-[#252b3d] border-solid content-stretch flex flex-col gap-[4px] items-start p-[13px] relative rounded-[8px] shrink-0 w-full">
                          <div className="font-inter font-semibold text-[18px] text-white tracking-[-0.18px] leading-[26px] w-full">
                            Attention Is All You Need
                          </div>
                          <div className="font-inter text-[13px] text-[#94a3b8] leading-[18px] w-full">
                            Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez,
                            <br />
                            Łukasz Kaiser, Illia Polosukhin
                          </div>
                          <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pt-[3.125px] pb-[0.875px] w-full">
                            The dominant sequence transduction models are based on complex recurrent or convolutional
                            neural networks that include an encoder and a decoder. The best performing models also
                            connect the encoder and decoder through an attention mechanism. We propose a new simple
                            network architecture, the Transformer, based solely on attention mechanisms, dispensing with
                            recurrence and convolutions entirely. Experiments on two machine translation tasks show these
                            models to be superior in quality while being more parallelizable and requiring significantly
                            less time to train.
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />

                    {/* Section 2 */}
                    <div className="content-stretch flex flex-col gap-[7px] relative shrink-0 w-full">
                      <SectionHeader
                        {...{ num: sectionTitles.s2[0], title: sectionTitles.s2[1] }}
                        open={open.s2}
                        onToggle={() => toggle("s2")}
                      />
                      {open.s2 && (
                        <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pb-[0.75px] w-full">
                          Recurrent models compute sequential representations alongside symbol positions of the input and
                          output sequences. Aligning positions to computational steps precludes parallelization within
                          training examples, generating severe throughput bottlenecks when sequence lengths grow
                          prohibitive. Furthermore, memory footprint explodes through long temporal dependency chains.
                        </div>
                      )}
                    </div>

                    <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />

                    {/* Section 3 */}
                    <div className="content-stretch flex flex-col gap-[8px] relative shrink-0 w-full">
                      <SectionHeader
                        {...{ num: sectionTitles.s3[0], title: sectionTitles.s3[1] }}
                        open={open.s3}
                        onToggle={() => toggle("s3")}
                      />
                      {open.s3 && (
                        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                          <p className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] w-full">
                            The model executes multi-headed dot-product transformations instead of recursive hidden
                            states. Queries, keys of dimension <Code>d_k</Code>, and values of dimension <Code>d_v</Code>{" "}
                            are evaluated across vectorized sets:
                          </p>
                          <div className="bg-[#12151e] border border-[#252b3d] border-solid content-stretch flex flex-col items-center justify-center overflow-auto p-[13px] relative rounded-[8px] shrink-0 w-full shadow-[inset_0px_2px_4px_1px_rgba(0,0,0,0.05)]">
                            <div className="font-mono font-medium text-[#c7d2fe] text-[14px] tracking-[0.35px] text-center leading-[22px]">
                              Attention(Q, K, V) = softmax( (Q Kᵀ) / √d_k ) V
                            </div>
                          </div>
                          <p className="font-inter text-[13px] text-[#94a3b8] leading-[21.13px] w-full">
                            Multi-head attention projects queries, keys, and values{" "}
                            <span className="font-semibold text-[#e2e8f0]">h = 8</span> times with independent, learned
                            linear projections to <span className="font-mono text-[#cbd5e1]">d_k = 64</span>, enabling
                            the model to jointly attend to information from disparate representation subspaces.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />

                    {/* Section 4 */}
                    <div className="content-stretch flex flex-col gap-[8px] relative shrink-0 w-full">
                      <SectionHeader
                        {...{ num: sectionTitles.s4[0], title: sectionTitles.s4[1] }}
                        open={open.s4}
                        onToggle={() => toggle("s4")}
                      />
                      {open.s4 && (
                        <div className="content-stretch flex gap-[8px] items-stretch justify-center relative shrink-0 w-full">
                          {stats.map((s) => (
                            <div
                              key={s.label}
                              className="bg-[#12151e] border border-[#252b3d] border-solid content-stretch flex flex-1 flex-col items-start justify-between min-w-px p-[13px] relative rounded-[8px]"
                            >
                              <div className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.33px] leading-[14px] w-full">
                                {s.label}
                              </div>
                              <div className="pt-[4px] w-full">
                                <div className="flex items-baseline gap-[8px] w-full">
                                  <span className="font-inter font-bold text-[#818cf8] text-[36px] tracking-[-0.9px] leading-[44px]">
                                    {s.value}
                                  </span>
                                  <span className="font-inter text-[13px] text-[#94a3b8] leading-[18px]">BLEU</span>
                                </div>
                              </div>
                              <div className="pt-[4px] w-full">
                                <p className="font-inter text-[13px] text-[#94a3b8] leading-[18px] w-full">
                                  {s.desc[0]}
                                  <br />
                                  {s.desc[1]}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />

                    {/* Section 5 */}
                    <div className="content-stretch flex flex-col gap-[7.125px] relative shrink-0 w-full">
                      <SectionHeader
                        {...{ num: sectionTitles.s5[0], title: sectionTitles.s5[1] }}
                        open={open.s5}
                        onToggle={() => toggle("s5")}
                      />
                      {open.s5 && (
                        <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pb-[0.875px] w-full">
                          The Transformer establishes the first sequence transduction architecture based entirely on
                          self-attention mechanisms. It trains drastically faster than architectures based on recurrent
                          or convolutional layers while setting new performance frontiers on benchmark machine
                          translation and parsing datasets.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chat turn 1: user */}
                <div className="content-stretch flex flex-col items-start pl-[48px] relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col gap-[6px] items-end relative shrink-0 w-full">
                    <div className="content-stretch flex gap-[7.99px] items-center relative shrink-0">
                      <span className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.33px] leading-[14px]">
                        10:45 AM
                      </span>
                      <span className="font-inter font-semibold text-[#e2e8f0] text-[13px] tracking-[0.13px] leading-[16px]">
                        You
                      </span>
                    </div>
                    <div className="bg-[#4f46e5] content-stretch flex flex-col items-start max-w-[493px] pl-[16px] pr-[45.53px] py-[12px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[2px] shrink-0 shadow-[0px_4px_6px_-1px_rgba(30,27,75,0.4),0px_2px_4px_-2px_rgba(30,27,75,0.4)]">
                      <p className="font-inter text-[14px] text-white leading-[22.75px]">
                        Why does Transformer scale the dot product by 1/√d_k instead of standard dot product?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat turn 2: assistant */}
                <div className="content-stretch flex flex-col items-start pr-[48px] relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center px-[4px] relative shrink-0 w-full">
                      <span className="font-inter font-semibold text-[#64748b] text-[11px] tracking-[0.33px] leading-[14px]">
                        10:46 AM
                      </span>
                    </div>
                    <div className="relative bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[12px] items-start p-[17px] rounded-[12px] shrink-0 w-full shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
                      <p className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] w-full">
                        The authors hypothesize that for large values of the projection dimension <Code>d_k</Code>, the
                        magnitude of the dot products grows substantially large. This scale escalation produces
                        detrimental consequences during softmax evaluation:
                      </p>

                      <div className="bg-[#12151e] border border-[#252b3d] border-solid content-stretch flex flex-col gap-[8px] items-start p-[13px] relative rounded-[8px] shrink-0 w-full">
                        <div className="content-stretch flex gap-[4px] items-center w-full">
                          <img alt="" src={`${A}/chat-note.svg`} className="h-[12px] w-[9px] shrink-0" />
                          <span className="font-inter font-semibold text-[#f1f5f9] text-[14px] leading-[22px]">
                            Variance Derivation of Vector Product
                          </span>
                        </div>
                        <p className="font-inter text-[13px] text-[#94a3b8] leading-[21.13px] w-full">
                          Assume the components of query <span className="font-mono text-[#cbd5e1]">q</span> and key{" "}
                          <span className="font-mono text-[#cbd5e1]">k</span> are independent random variables with mean{" "}
                          <span className="font-mono text-[#cbd5e1]">0</span> and variance{" "}
                          <span className="font-mono text-[#cbd5e1]">1</span>. Then their dot product:
                        </p>
                        <div className="bg-[#0b0d13] border border-[rgba(42,48,68,0.6)] border-solid content-stretch flex flex-col items-center p-[9px] relative rounded-[4px] shrink-0 w-full">
                          <div className="font-mono text-[#c7d2fe] text-[13px] text-center leading-[20px]">
                            q · k = ∑ᵢ₌₁ᵈᵏ (qᵢ · kᵢ) ⟹ Mean = 0, Var = d_k
                          </div>
                        </div>
                        <p className="font-inter text-[13px] text-[#94a3b8] leading-[21.13px] w-full">
                          As <span className="font-mono text-[#cbd5e1]">d_k</span> expands, standard deviation increases
                          to <span className="font-mono text-[#cbd5e1]">√d_k</span>. Dot products with large magnitudes
                          push the softmax function into regions with extremely miniature gradients (softmax saturation),
                          impeding backpropagation and destabilizing gradient flow.
                        </p>
                      </div>

                      <p className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] w-full">
                        Dividing by <Code>√d_k</Code> counteracts this variance expansion, scaling the variance back down
                        to <span className="font-mono font-medium text-[#e2e8f0] text-[13px]">1</span> and ensuring
                        stable gradient signals across deeper Transformer layers.
                      </p>

                      <div className="content-stretch flex flex-wrap gap-[8px] items-center relative shrink-0 w-full pt-[9px]">
                        <span className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase leading-[14px] pr-[4px]">
                          Evidence:
                        </span>
                        {evidence.map((e) => (
                          <button
                            key={e.label}
                            type="button"
                            className="bg-[rgba(30,27,75,0.7)] border border-[rgba(67,56,202,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[9px] py-[5px] relative rounded-full shrink-0 cursor-pointer hover:border-[#6366f1] transition-colors"
                          >
                            <img alt="" src={e.icon} className={`shrink-0 ${e.cls}`} />
                            <span className="font-inter font-semibold text-[#a5b4fc] text-[11px] text-center tracking-[0.33px] leading-[14px] whitespace-nowrap">
                              {e.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Docked sources panel */}
            <aside className="bg-[#11141d] border-[#1e2230] border-l border-solid content-stretch flex flex-col items-start relative shrink-0 w-[320px] self-stretch shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]">
              <div className="flex-1 min-h-px relative w-full">
                <div className="bg-clip-padding content-stretch flex flex-col items-start relative size-full">
                  <div className="border-[#1e2230] border-b border-solid content-stretch flex items-center justify-between pb-[17px] pt-[16px] px-[16px] relative shrink-0 w-full">
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                      <img alt="" src={`${A}/chat-sources.svg`} className="h-[15.875px] w-[15px] shrink-0" />
                      <span className="font-inter font-semibold text-[#f1f5f9] text-[14px] leading-[22px]">
                        Sources
                      </span>
                    </div>
                    <button
                      type="button"
                      className="content-stretch flex items-center justify-center pb-[10px] pt-[4px] px-[4px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#161922]"
                    >
                      <img alt="" src={`${A}/chat-panel-close.svg`} className="relative shrink-0 size-[10.5px]" />
                    </button>
                  </div>

                  <div className="content-stretch flex flex-col items-start pt-[12px] px-[16px] relative shrink-0 w-full">
                    <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex items-center justify-between p-[13px] relative rounded-[12px] shrink-0 w-full">
                      <div className="content-stretch flex flex-col items-start relative shrink-0">
                        <span className="font-inter font-semibold text-[#e2e8f0] text-[13px] tracking-[0.13px] leading-[16px] whitespace-nowrap">
                          Academic Web Search
                        </span>
                        <span className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.33px] leading-[14px] whitespace-nowrap">
                          Search accross the web
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={webSearch}
                        onClick={() => setWebSearch((v) => !v)}
                        className={`h-[24px] relative rounded-full shrink-0 w-[44px] cursor-pointer transition-colors duration-200 ${
                          webSearch ? "bg-[#22c55e]" : "bg-[#2a3044]"
                        }`}
                      >
                        <div
                          className={`absolute bg-white rounded-full size-[20px] top-[2px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] transition-transform duration-200 ${
                            webSearch ? "translate-x-[22px]" : "translate-x-[2px]"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-px overflow-auto relative w-full">
                    <div className="font-inter font-semibold text-[#94a3b8] text-[16px] tracking-[0.8px] uppercase leading-[24px] px-[20px] pt-[16px] pb-[8px]">
                      Referenced Corpus
                    </div>
                    <div className="content-stretch flex flex-col gap-[8px] items-start px-[16px] pb-[16px] w-full">
                      {sources.map((s) => (
                        <div
                          key={s.title}
                          className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[4px] items-start p-[13px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:border-[#3b4361] transition-colors"
                        >
                          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                            <div className="content-stretch flex gap-[4px] items-center min-w-px overflow-hidden relative shrink-0">
                              <img alt="" src={s.icon} className="relative shrink-0 size-[15px]" />
                              <span className="font-inter font-semibold text-[#e2e8f0] text-[13px] tracking-[0.13px] leading-[16px] truncate">
                                {s.title}
                              </span>
                            </div>
                            <div
                              className={`content-stretch flex flex-col items-start px-[7px] py-[3px] relative rounded-[4px] shrink-0 border ${
                                s.badge === "PDF"
                                  ? "bg-[rgba(30,27,75,0.7)] border-[rgba(55,48,163,0.4)]"
                                  : "bg-[rgba(8,47,73,0.7)] border-[rgba(7,89,133,0.4)]"
                              }`}
                            >
                              <span
                                className={`font-inter font-semibold text-[11px] tracking-[0.33px] leading-[14px] ${
                                  s.badge === "PDF" ? "text-[#a5b4fc]" : "text-[#7dd3fc]"
                                }`}
                              >
                                {s.badge}
                              </span>
                            </div>
                          </div>
                          <div className="font-inter text-[13px] text-[#94a3b8] leading-[18px] w-full">{s.meta}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-[#1e2230] border-t border-solid content-stretch flex flex-col items-start pb-[16px] pt-[17px] px-[16px] relative shrink-0 w-full">
                    <button
                      type="button"
                      className="bg-[#161922] border border-[#2a3044] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] items-center justify-center px-[13px] py-[9px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:bg-[#1b202e] transition-colors"
                    >
                      <img alt="" src={`${A}/chat-plus.svg`} className="relative shrink-0 size-[10.5px]" />
                      <span className="font-inter font-medium text-[#e2e8f0] text-[13px] text-center tracking-[0.13px] leading-[16px]">
                        Add External Source
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Persistent floating query console */}
      <div className="absolute bottom-0 content-stretch flex flex-col items-center left-[89px] p-[16px] right-[171px] z-10">
        <div className="backdrop-blur-[12px] bg-[rgba(22,25,34,0.95)] border border-[#2a3044] border-solid content-stretch flex flex-col max-w-[760px] relative rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-[760px]">
          {(file || error || status) && (
            <div className="flex flex-wrap items-center gap-[6px] px-[13px] pt-[10px]">
              {file && <PdfChip file={file} onRemove={clearPdf} />}
              {error && <span className="font-inter text-[12px] text-[#f87171]">{error}</span>}
              {!error && status && <span className="font-inter text-[12px] text-[#94a3b8]">{status}</span>}
            </div>
          )}
          <div className="content-stretch flex gap-[8px] items-center pl-[13px] pr-[5px] py-[5px]">
            <button
              type="button"
              onClick={openPdf}
              aria-label="Attach a PDF"
              className="content-stretch flex flex-col items-center justify-center pb-[10px] pt-[4px] px-[4px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#1b202e]"
            >
              <img alt="" src={`${A}/chat-attach.svg`} className="h-[16.667px] w-[10.417px] shrink-0" />
            </button>
            <PdfFileInput inputRef={inputRef} onChange={onPdfChange} />
            <div className="flex-1 min-w-px relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Ask a question about this paper, test hypotheses, or probe equations..."
                className="bg-transparent border-0 font-inter font-normal text-[14px] text-[#f8fafc] leading-normal outline-none p-0 placeholder:text-[#64748b] w-full"
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              className={`bg-[#4f46e5] relative rounded-[12px] shrink-0 size-[40px] cursor-pointer shadow-[0px_4px_6px_-1px_rgba(49,46,129,0.4),0px_2px_4px_-2px_rgba(49,46,129,0.4)] ${
                sending ? "opacity-40" : ""
              }`}
            >
              <div className="flex items-center justify-center relative size-full">
                <img alt="" src={`${A}/chat-send.svg`} className="relative shrink-0 size-[13.333px]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
