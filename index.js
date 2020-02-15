import { Setting, SettingsObject } from "SettingsManager/SettingsManager"

var sbsettings = new SettingsObject("SidebarModule", [
    {
        "name": "Sidebar",
        "settings": [
            new Setting.Toggle("Toggled", true),
            new Setting.Toggle("Show Numbers", false),
            new Setting.Slider("Title Scale", 100, 50, 200),
            new Setting.Slider("Scores Scale", 100, 50, 200),
            new Setting.Toggle("Murse Mode", false),
            new Setting.Button("Move Display", "click", function() {
                sb.gui.open();
            }),
            new Setting.Button("Reset Settings", "click", function() {
                sbsettings.reset();
                sbsettings.load();
            }),
            new Setting.Slider("x", 0.995, 0, 1).setHidden(true),
            new Setting.Slider("y", 0.40, 0, 1).setHidden(true)
        ]
    }, {
        "name": "Colors",
        "settings": [
            new Setting.ColorPicker("Title Color", [0, 0, 0]),
            new Setting.Slider("Title Alpha", 100, 0, 255),
            new Setting.ColorPicker("Background Color", [0, 0, 0]),
            new Setting.Slider("Background Alpha", 64, 0, 255),
            new Setting.ColorPicker("Number Color", [255, 255, 255])
        ]
    }
]).setCommand("sb").setSize(200, 130);

Setting.register(sbsettings);

var sb = {
    display: new Display().setBackground(DisplayHandler.Background.FULL),
    numbers: new Display().setBackground(DisplayHandler.Background.FULL),
    gui: new Gui()
};

sb.display.setRenderLoc(
    Renderer.screen.getWidth() * sbsettings.getSetting("Sidebar", "x"),
    Renderer.screen.getHeight() * sbsettings.getSetting("Sidebar", "y")
);

sb.gui.registerDraw(function() {
    new Text("Drag to move sidebar", 0, 0).draw();
    if (sb.display.getAlign() == DisplayHandler.Align.RIGHT) {
        Renderer.drawRect(0xffff0000, sb.display.getRenderX() + 5, sb.display.getRenderY() - 5, -75, 1);
        Renderer.drawRect(0xffff0000, sb.display.getRenderX() + 5, sb.display.getRenderY() - 5, 1, 100);
    } else {
        Renderer.drawRect(0xffff0000, sb.display.getRenderX() - 5, sb.display.getRenderY() - 5, 75, 1);
        Renderer.drawRect(0xffff0000, sb.display.getRenderX() - 5, sb.display.getRenderY() - 5, 1, 100);
    }
});

register("dragged", function(dx, dy) {
    if (!sb.gui.isOpen()) return;

    sb.display.setRenderLoc(
        sb.display.getRenderX() + dx,
        sb.display.getRenderY() + dy
    )

    sbsettings.getSettingObject("Sidebar", "x").value = MathLib.map(
        sb.display.getRenderX(),
        0, Renderer.screen.getWidth(),
        0, 1
    );

    sbsettings.getSettingObject("Sidebar", "y").value = MathLib.map(
        sb.display.getRenderY(),
        0, Renderer.screen.getHeight(),
        0, 1
    );
    sbsettings.save();

    if (sb.display.getAlign() == DisplayHandler.Align.RIGHT) {
        sb.numbers.setRenderLoc(
            sb.display.getRenderX() + 2,
            sb.display.getRenderY()
        )
    } else {
        sb.numbers.setRenderLoc(
            sb.display.getRenderX() + sb.display.getWidth() + 2,
            sb.display.getRenderY()
        )
    }
});

register("tick", function() {
    if (!sbsettings.getSetting("Sidebar", "Toggled")) {
        Scoreboard.setShouldRender(true);
        sb.display.shouldRender = false;
        sb.numbers.shouldRender = false;
        return;
    }
    var murseMode = sbsettings.getSetting("Sidebar", "Murse Mode");

    sb.numbers.shouldRender = sbsettings.getSetting("Sidebar", "Show Numbers");

    Scoreboard.setShouldRender(false);
    sb.display.shouldRender = true;

    if (Scoreboard.getLines().length == 0) {
        sb.display.shouldRender = false;
        sb.numbers.shouldRender = false;
        return;
    }

    sb.display.setRenderLoc(
        Renderer.screen.getWidth() * sbsettings.getSetting("Sidebar", "x"), 
        Renderer.screen.getHeight() * sbsettings.getSetting("Sidebar", "y")
    );

    sb.display.setAlign(
        (sb.display.getRenderX() > Renderer.screen.getWidth() / 2)
        ? DisplayHandler.Align.RIGHT 
        : DisplayHandler.Align.LEFT
    );

    if (sb.display.getAlign() == DisplayHandler.Align.RIGHT) {
        sb.numbers.setRenderLoc(
            sb.display.getRenderX() + 2,
            sb.display.getRenderY()
        );
    } else {
        sb.numbers.setRenderLoc(
            sb.display.getRenderX() + sb.display.getWidth() + 2,
            sb.display.getRenderY()
        );
    }

    sb.display.clearLines();
    sb.numbers.clearLines();

    try {
        var tempColor = sbsettings.getSetting("Colors", "Title Color");
        var tempAlpha = sbsettings.getSetting("Colors", "Title Alpha");
        var tempScale = sbsettings.getSetting("Sidebar", "Title Scale");
        var color = Renderer.color(tempColor[0], tempColor[1], tempColor[2], tempAlpha);
        sb.display.addLine(
            new DisplayLine("  " + Scoreboard.getTitle() + "  ")
            .setAlign("center")
            .setBackgroundColor(color)
            .setScale(tempScale / 100)
        );
        sb.numbers.addLine(new DisplayLine("").setBackgroundColor(color).setScale(tempScale / 100));
    
        tempColor = sbsettings.getSetting("Colors", "Background Color");
        tempAlpha = sbsettings.getSetting("Colors", "Background Alpha");
        tempScale = sbsettings.getSetting("Sidebar", "Scores Scale");
        color = Renderer.color(tempColor[0], tempColor[1], tempColor[2], tempAlpha);
        tempColor = sbsettings.getSetting("Colors", "Number Color");
        ncolor = Renderer.color(tempColor[0], tempColor[1], tempColor[2]);
        
        Scoreboard.getLines().forEach(function(score) {
            var position = (score.getPoints() >= 0) 
                ? Scoreboard.getLines().length - score.getPoints() + 1
                : Math.abs(score.getPoints());
            var line = score.getName();
            if (murseMode) {
                line = line
                    .replace("Coins", "Murse")
                    .replace("Purse", "Murse")
                    .replace("Piggy", "Miggy");
            }
    
            sb.display.setLine(
                position,
                new DisplayLine(line)
                    .setAlign("left")
                    .setBackgroundColor(color)
                    .setScale(tempScale / 100)
            );
    
            sb.numbers.setLine(
                position, 
                new DisplayLine(score.getPoints())
                    .setAlign("right")
                    .setTextColor(ncolor)
                    .setBackgroundColor(color)
                    .setScale(tempScale / 100)
            );
        });
    } catch {
        return;
    }
})